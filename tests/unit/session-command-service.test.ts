import { describe, expect, it } from "vitest";

import { parseSessionCommand, validateSessionAlias } from "../../src/session-command-service";

describe("session-command-service", () => {
  it("parses session alias commands", () => {
    expect(parseSessionCommand("/session-alias show")).toEqual({
      scope: "session-alias-show",
    });
    expect(parseSessionCommand("/session-alias set shared-dev")).toEqual({
      scope: "session-alias-set",
      peerId: "shared-dev",
    });
    expect(parseSessionCommand("/session-alias clear")).toEqual({
      scope: "session-alias-clear",
    });
  });

  it("returns unknown for incomplete session alias set command", () => {
    expect(parseSessionCommand("/session-alias set")).toEqual({
      scope: "unknown",
    });
  });

  it("validates session alias pattern", () => {
    expect(validateSessionAlias("shared-dev")).toBeNull();
    expect(validateSessionAlias("shared:dev")).toContain("[a-zA-Z0-9_-]{1,64}");
  });
});
