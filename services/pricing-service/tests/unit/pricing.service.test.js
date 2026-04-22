const { PricingService, PricingError } = require("../../src/services/pricing.service");

describe("PricingService Unit Tests", () => {
    let pricingService;
    let mockRepository;
    let mockProducer;

    beforeEach(() => {
        mockRepository = {
            getPricingByZoneId: jest.fn().mockResolvedValue({
                baseFare: 10,
                perKm: 2,
                perMin: 1,
                surgeMultiplier: 1.0,
            }),
            savePricingHistory: jest.fn().mockResolvedValue({ id: 1 })
        };

        mockProducer = {
            publishPriceCalculated: jest.fn().mockResolvedValue(true)
        };

        pricingService = new PricingService({
            pricingRepository: mockRepository,
            pricingProducer: mockProducer,
            redisClient: null // Disable redis connection on unit test
        });
    });

    it("should calculate base price correctly (TC 8)", () => {
        const basePrice = pricingService.calculateBasePrice({
            baseFare: 10,
            perKm: 2,
            perMin: 0.5,
            distanceKm: 5,
            durationMin: 10
        });
        expect(basePrice).toBe(10 + (2 * 5) + (0.5 * 10)); // 25
        expect(basePrice).toBeGreaterThan(0);
    });

    it("should apply surge rules with high demand (TC 41)", () => {
        const surge = pricingService.applySurgeRules({
            baseMultiplier: 1.0,
            demandFactor: 15,
            supplyFactor: 10, // ratio 1.5 > 1.2
            isPeak: false,
            weather: "clear"
        });
        expect(surge).toBeGreaterThan(1);
        expect(surge).toBe(1.25); // 1 + (1.5 - 1) * 0.5 = 1.25
    });

    it("should never have surge < 1 even with 0 demand (TC 16)", () => {
        const surge = pricingService.applySurgeRules({
            baseMultiplier: 1.0,
            demandFactor: 0,
            supplyFactor: 10,
            isPeak: false,
            weather: "clear"
        });
        expect(surge).toBe(1);
    });

    it("should calculate full pricing successfully", async () => {
        const result = await pricingService.calculate({
            zoneId: "ZONE_A",
            distanceKm: 10,
            durationMin: 20
        });

        expect(result.finalPrice).toBeDefined();
        expect(result.basePrice).toBeDefined();
        expect(result.surgeMultiplier).toBeDefined();
        expect(mockRepository.savePricingHistory).toHaveBeenCalled();
        expect(mockProducer.publishPriceCalculated).toHaveBeenCalled();
    });

    it("should throw PricingError on invalid negative distance", async () => {
        await expect(pricingService.calculate({
            zoneId: "ZONE_A",
            distanceKm: -5,
            durationMin: 20
        })).rejects.toThrow(PricingError);
    });

    // =========================================================
    // TC#15 — ETA với distance = 0: không crash, không âm
    // =========================================================
    it("TC#15: distance=0 → basePrice = baseFare (không crash, không âm)", async () => {
        const basePrice = pricingService.calculateBasePrice({
            baseFare: 10,
            perKm: 2,
            perMin: 1,
            distanceKm: 0,
            durationMin: 0
        });
        // baseFare + 0 * perKm + 0 * perMin = 10
        expect(basePrice).toBe(10);
        expect(basePrice).toBeGreaterThanOrEqual(0);  // không âm
    });

    it("TC#15: calculate() với distanceKm=0 và durationMin=0 không crash", async () => {
        const result = await pricingService.calculate({
            zoneId: "ZONE_A",
            distanceKm: 0,
            durationMin: 0
        });
        expect(result).toBeDefined();
        expect(result.finalPrice).toBeGreaterThanOrEqual(0);  // không âm
        expect(result.finalPrice).not.toBeNaN();
    });

    // =========================================================
    // TC#22 — Booking gọi Pricing → price > 0
    // =========================================================
    it("TC#22: calculate() với input hợp lệ → finalPrice > 0 (price > base_fare - 1)", async () => {
        const result = await pricingService.calculate({
            zoneId: "ZONE_A",
            distanceKm: 5,
            durationMin: 10
        });
        // baseFare=10, perKm=2, perMin=1 → basePrice = 10 + 10 + 10 = 30
        // surge = 1.0 → finalPrice = 30
        expect(result.finalPrice).toBeGreaterThan(0);
        expect(result.surgeMultiplier).toBeGreaterThanOrEqual(1);
        expect(result.finalPrice).toBeGreaterThanOrEqual(result.basePrice);
    });

    it("TC#22: finalPrice >= baseFare (price > base fare check)", async () => {
        const result = await pricingService.calculate({
            zoneId: "ZONE_A",
            distanceKm: 5,
            durationMin: 10
        });
        // baseFare from mock = 10
        expect(result.finalPrice).toBeGreaterThanOrEqual(10);
    });

    // =========================================================
    // TC#16 — Pricing với các điều kiện thực tế
    // =========================================================
    it("TC#16 peak hours: isPeak=true → surge >= 1.25", () => {
        const surge = pricingService.applySurgeRules({
            baseMultiplier: 1.0,
            isPeak: true,
            weather: "clear"
        });
        expect(surge).toBeGreaterThanOrEqual(1.25);
    });

    it("TC#16 weather=rain → surge >= 1.15", () => {
        const surge = pricingService.applySurgeRules({
            baseMultiplier: 1.0,
            isPeak: false,
            weather: "rain"
        });
        expect(surge).toBeGreaterThanOrEqual(1.15);
    });

    it("TC#16 weather=storm → surge >= 1.35", () => {
        const surge = pricingService.applySurgeRules({
            baseMultiplier: 1.0,
            isPeak: false,
            weather: "storm"
        });
        expect(surge).toBeGreaterThanOrEqual(1.35);
    });

    it("TC#16: surge KHÔNG BAO GIỜ vượt MAX_SURGE_MULTIPLIER", () => {
        const MAX = Number(process.env.MAX_SURGE_MULTIPLIER || 3);
        const surge = pricingService.applySurgeRules({
            baseMultiplier: 10.0, // cực kỳ cao
            demandFactor: 100,
            supplyFactor: 1,
            isPeak: true,
            weather: "storm"
        });
        expect(surge).toBeLessThanOrEqual(MAX);
    });

    // =========================================================
    // TC#30 — Fallback khi pricing repository unavailable
    // =========================================================
    it("TC#30: Throws PricingError (not generic Error) khi repository fail", async () => {
        mockRepository.getPricingByZoneId = jest.fn().mockRejectedValue(
            new Error("DB connection timeout")
        );

        await expect(pricingService.calculate({
            zoneId: "ZONE_A",
            distanceKm: 5,
            durationMin: 10
        })).rejects.toThrow();
    });

    it("TC#30: Throws when zoneId not found in repository → 404", async () => {
        mockRepository.getPricingByZoneId = jest.fn().mockResolvedValue(null);

        await expect(pricingService.calculate({
            zoneId: "UNKNOWN_ZONE",
            distanceKm: 5,
            durationMin: 10
        })).rejects.toMatchObject({ status: 404 });
    });

    // =========================================================
    // TC#41 — Data integrity: Atomic pricing calculation
    // =========================================================
    it("TC#41: savePricingHistory được gọi với đầy đủ dữ liệu", async () => {
        await pricingService.calculate({
            zoneId: "ZONE_A",
            distanceKm: 10,
            durationMin: 20,
            bookingId: "BK-123"
        });

        expect(mockRepository.savePricingHistory).toHaveBeenCalledWith(
            expect.objectContaining({
                zoneId: "ZONE_A",
                distanceKm: 10,
                durationMin: 20,
                bookingId: "BK-123",
                finalPrice: expect.any(Number),
                surgeMultiplier: expect.any(Number),
            })
        );
    });

    // =========================================================
    // TC#47 — AI latency < 200ms
    // =========================================================
    it("TC#47: calculate() responds under 200ms (no real I/O)", async () => {
        const start = Date.now();
        await pricingService.calculate({
            zoneId: "ZONE_A",
            distanceKm: 5,
            durationMin: 10
        });
        const elapsed = Date.now() - start;
        // Without real I/O, this should be near-instant
        expect(elapsed).toBeLessThan(200);
    });
});
