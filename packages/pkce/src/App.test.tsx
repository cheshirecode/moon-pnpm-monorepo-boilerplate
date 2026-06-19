/**
 * @vitest-environment happy-dom
 */
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import createFetchMock from "vitest-fetch-mock";

import App from "./App";

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();

beforeEach(() => {
  history.pushState(null, "", "https://localhost");
  fetchMocker.resetMocks();
});
describe("main App", () => {
  it("clicking Login navigates to authz URI", async () => {
    const renderedApp = render(<App />);
    const user = userEvent.setup();
    const loginBtn = renderedApp.getByTestId("btn-login");
    expect(loginBtn).toBeTruthy();
    await user.click(loginBtn);
    const state = localStorage.getItem("pkce_state");
    expect(state).toBeTruthy();
    expect(document.cookie).toContain(`app.txs.${state}`);
  });

  it("on redirected URL with state and code", async () => {
    const code = "ygo9jssbmmvgokjwuqx5";
    const state = "redirect-state";
    localStorage.setItem("pkce_state", state);
    history.pushState(null, "", `https://localhost/?state=${state}&code=${code}`);
    const renderedApp = render(<App />);
    const user = userEvent.setup();

    const mockSuccessResponse = {
      access_token: "token",
      expires_at: 123,
      refresh_token: "refresh",
      scope: "*",
      token_type: "type",
    };
    fetchMocker.mockResponseOnce(JSON.stringify(mockSuccessResponse));
    const stateEle = await renderedApp.findByTestId("state-value");
    expect(stateEle.innerHTML).toEqual(localStorage.getItem("pkce_state"));
    const codeEle = await renderedApp.findByTestId("code-value");
    await user.click(codeEle);
    expect(codeEle.innerHTML).toEqual(code);
  });

  it("should refresh token", async () => {
    localStorage.setItem("refresh_token", "old");
    const renderedApp = render(<App />);
    const mockSuccessResponse = {
      access_token: "token",
      expires_at: 123,
      refresh_token: "refresh",
      scope: "*",
      token_type: "type",
    };
    fetchMocker.mockResponseOnce(JSON.stringify(mockSuccessResponse));
    const logoutBtn = renderedApp.getByTestId("btn-logout");
    expect(logoutBtn).toBeTruthy();
  });
});
