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
});
