import { getDigitalAssetReturnPath } from "../navigation";

describe("getDigitalAssetReturnPath", () => {
  const roomBase = "/organizations/org-1/groups/group-1/rooms/room-1";

  test("returns the personal Digital Assets page without a folder", () => {
    expect(getDigitalAssetReturnPath("", undefined)).toBe("/digitalassets");
  });

  test("returns the personal folder preview route", () => {
    expect(getDigitalAssetReturnPath("", "folder-123")).toBe(
      "/digitalassets/folders/folder-123"
    );
  });

  test("returns the room Digital Assets page without a folder", () => {
    expect(getDigitalAssetReturnPath(roomBase, undefined)).toBe(
      `${roomBase}/digitalassets`
    );
  });

  test("returns the room folder preview route", () => {
    expect(getDigitalAssetReturnPath(roomBase, "folder-123")).toBe(
      `${roomBase}/folders/folder-123`
    );
  });
});
