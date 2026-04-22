const request = require("supertest");
const jwt = require("jsonwebtoken");

jest.mock("../../src/services/pricing.service", () => {
    return {
        PricingService: jest.fn().mockImplementation(() => ({
            calculate: jest.fn().mockResolvedValue({
                finalPrice: 50,
                basePrice: 40,
                surgeMultiplier: 1.25,
                zoneId: "z1",
                currency: "USD"
            }),
            getCurrent: jest.fn().mockResolvedValue({
                baseFare: 10,
                perKm: 2,
                perMin: 1,
            })
        }))
    };
});

const createApp = require("../../src/app");
const { PricingService } = require("../../src/services/pricing.service");
const { createPricingController } = require("../../src/controllers/pricing.controller");

describe("Pricing API Integration Tests (Zero-Trust & Validation)", () => {
    let app;
    let validToken;

    beforeAll(() => {
        validToken = jwt.sign({ id: "user_1", role: "user" }, process.env.JWT_SECRET);
        const mockService = new PricingService();
        const controller = createPricingController(mockService);
        app = createApp(controller);
    });

    describe("Zero Trust Security (TC 91-96)", () => {
        it("should return 401 when no token is provided", async () => {
            const res = await request(app)
                .post("/pricing/calculate")
                .send({ zoneId: "z1", distanceKm: 5, durationMin: 10 });
            
            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Missing token");
        });

        it("should return 403 when an invalid token is provided", async () => {
            const res = await request(app)
                .post("/pricing/calculate")
                .set("Authorization", "Bearer invalid_token_123")
                .send({ zoneId: "z1", distanceKm: 5, durationMin: 10 });
            
            expect(res.status).toBe(403);
            expect(res.body.message).toBe("Invalid token");
        });
    });

    describe("Input Validation", () => {
        it("should return 422 Unprocessable Entity when missing required fields (TC 11-12)", async () => {
            const res = await request(app)
                .post("/pricing/calculate")
                .set("Authorization", `Bearer ${validToken}`)
                .send({ distanceKm: 5, durationMin: 10 }); // missing zoneId
            
            expect(res.status).toBe(422);
            expect(res.body.code).toBe("VALIDATION_FAILED");
        });

        it("should return 422 when field types are wrong (TC 11-12)", async () => {
            const res = await request(app)
                .post("/pricing/calculate")
                .set("Authorization", `Bearer ${validToken}`)
                .send({ zoneId: "z1", distanceKm: "five", durationMin: 10 }); // distance is string
            
            expect(res.status).toBe(422);
            expect(res.body.code).toBe("VALIDATION_FAILED");
        });
    });

    describe("Happy Path", () => {
        it("should calculate price successfully (TC 8)", async () => {
            const res = await request(app)
                .post("/pricing/calculate")
                .set("Authorization", `Bearer ${validToken}`)
                .send({ zoneId: "z1", distanceKm: 5, durationMin: 10 });
            
            expect(res.status).toBe(200);
            expect(res.body.finalPrice).toBe(50);
        });
    });
});
