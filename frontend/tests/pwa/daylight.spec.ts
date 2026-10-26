import { expect, test, Page } from "@playwright/test";

const ids = ["daylight", "0", "solar", "1", "2", "3", "progress", "hue"];
const names = ["Daylight", "Face 0", "Solar face", "Face 1", "Face 2", "Face 3", "Progress Bars", "Hue Clock"];

async function checkPage(page: Page, index: number) {
  await expect(page.getByTestId("clock-face-position")).toHaveText(`${names[index]} · ${index + 1} of ${ids.length}`);
  await expect(page.getByTestId(`clock-face-dot-${ids[index]}`)).toHaveAttribute("aria-selected", "true");
  if (ids[index] === "hue") await expect(page.getByTestId("clock-hue-background")).toBeVisible();
  else await expect(page.getByTestId("clock-hue-background")).toHaveCount(0);
  await expect.poll(() => page.getByTestId("clock-face-pager").evaluate((el, value) => Math.abs(el.scrollLeft - el.clientWidth * value), index)).toBeLessThan(2);
}

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile-pwa") {
    // Exercise the installed iOS viewport path in the production export.
    await page.addInitScript(() => Object.defineProperty(navigator, "standalone", { value: true }));
  }
  // Let Date.now advance: RN Web uses it to throttle scroll events.
  await page.clock.install({ time: new Date("2026-06-21T12:00:00Z") });
});

test("dots, arrows, swipes, reload and rotation keep the selected face synchronized", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/time");
  await checkPage(page, 0);
  await expect(page.getByTestId("clock-face-previous")).toBeDisabled();
  for (let index = 1; index < ids.length; index++) {
    await page.getByTestId(`clock-face-dot-${ids[index]}`).click();
    await checkPage(page, index);
  }
  await expect(page.getByTestId("clock-face-next")).toBeDisabled();
  await page.getByTestId("clock-face-previous").click();
  await checkPage(page, ids.length - 2);
  await page.reload();
  await checkPage(page, ids.length - 2);
  await page.setViewportSize({ width: 844, height: 390 });
  await checkPage(page, ids.length - 2);
  await page.getByTestId("clock-face-dot-daylight").click();
  await checkPage(page, 0);
  await page.setViewportSize({ width: 390, height: 844 });
  await checkPage(page, 0);

  if (testInfo.project.name === "mobile-pwa") {
    const box = (await page.getByTestId("clock-face-pager").boundingBox())!;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 340, y: box.y + box.height / 2 }] });
    for (let x = 310; x >= 40; x -= 30) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: box.y + box.height / 2 }] });
      await page.waitForTimeout(20);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await page.getByTestId("clock-face-pager").hover();
    await page.mouse.wheel(390, 0);
  }
  await checkPage(page, 1);
  await page.getByTestId("clock-face-next").click();
  await checkPage(page, 2);
  // Keyboard activation must update the same state as mouse/touch navigation.
  await page.getByTestId("clock-face-dot-daylight").focus();
  await page.keyboard.press("Enter");
  await checkPage(page, 0);
  expect(errors).toEqual([]);
});

test("production PWA keeps locations, calculations and all faces available offline", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/time");
  await checkPage(page, 0);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
  });
  await context.setOffline(true);
  await page.getByTestId("daylight-change-location").click();
  await page.getByRole("textbox", { name: "Search cities" }).fill("New York");
  await page.getByRole("button", { name: "Select New York", exact: true }).click();
  await expect(page.getByTestId("clock-standard")).toContainText("08:00:");
  await expect(page.getByTestId("daylight-sunrise")).toContainText("05:25");
  await page.reload();
  await expect(page.getByTestId("daylight-change-location")).toContainText("New York");
  await expect(page.getByTestId("clock-standard")).toContainText("08:00:");
  await page.getByTestId("daylight-change-location").click();
  await page.getByTestId("daylight-location-mode-manual").click();
  await page.getByRole("textbox", { name: "Latitude", exact: true }).fill("91");
  await page.getByTestId("daylight-save-location").click();
  await expect(page.getByRole("alert")).toHaveText("Enter a latitude from −90 to 90.");
  await page.getByRole("textbox", { name: "Location name", exact: true }).fill("North Pole");
  await page.getByRole("textbox", { name: "Latitude", exact: true }).fill("90");
  await page.getByRole("textbox", { name: "Longitude", exact: true }).fill("0");
  await page.getByRole("textbox", { name: "Time zone", exact: true }).fill("Invalid/Zone");
  await page.getByTestId("daylight-save-location").click();
  await expect(page.getByRole("alert")).toContainText("valid time zone");
  await page.getByRole("textbox", { name: "Time zone", exact: true }).fill("UTC");
  await page.getByTestId("daylight-save-location").click();
  await expect(page.getByTestId("daylight-polar-state")).toContainText("Polar day");
  await expect(page.getByTestId("daylight-sunrise-marker")).toHaveCount(0);
  await expect(page.getByTestId("daylight-sunset-marker")).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("daylight-change-location")).toContainText("North Pole");
  await page.clock.setSystemTime(new Date("2026-12-21T12:00:00Z"));
  await expect(page.getByTestId("daylight-polar-state")).toContainText("Polar night");
  for (let index = 1; index < ids.length; index++) {
    await page.getByTestId(`clock-face-dot-${ids[index]}`).click();
    await checkPage(page, index);
  }
  expect(errors).toEqual([]);
});

test("legacy face indexes migrate and corrupt location settings recover", async ({ page }) => {
  await page.goto("/time");
  await page.evaluate(() => {
    localStorage.removeItem("seximal.clock.face.v2");
    localStorage.setItem("seximal.clock.face", JSON.stringify(1));
    localStorage.setItem("seximal.clock.daylight.location", JSON.stringify('{"latitude":null}'));
  });
  await page.reload();
  await checkPage(page, 2);
  await page.getByTestId("clock-face-dot-daylight").click();
  await checkPage(page, 0);
  await expect(page.getByTestId("daylight-change-location")).toContainText("London");
});
