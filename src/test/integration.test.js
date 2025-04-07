const request = require("supertest");
const app = require("../index");

describe("Prach Browse Integration Tests", () => {
  test("GET / should return home page", async () => {
    const response = await request(app).get("/");
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Prach Browse");
    expect(response.text).toContain("Privacy Features");
  });

  test("GET /settings should return settings page", async () => {
    const response = await request(app).get("/settings");
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("Settings");
    expect(response.text).toContain("Content Filter Level");
  });

  test("GET /about should return about page", async () => {
    const response = await request(app).get("/about");
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain("About Prach Browse");
    expect(response.text).toContain("Architecture");
  });

  test("GET /browse without URL should redirect to home", async () => {
    const response = await request(app).get("/browse");
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/");
  });

  test("GET /search without query should redirect to home", async () => {
    const response = await request(app).get("/search");
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/");
  });

  test("GET /nonexistent should return 404", async () => {
    const response = await request(app).get("/nonexistent");
    expect(response.statusCode).toBe(404);
    expect(response.text).toContain("Page Not Found");
  });
});
