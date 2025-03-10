import React from "react";
import { render, act } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { AuthProvider, useAuth } from "../context/auth"; 
import axios from "axios";

const localStorageMock = (function () {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

jest.mock("axios", () => ({
  defaults: {
    headers: {
      common: {},
    },
  },
}));

const TestComponent = () => {
  const [auth, setAuth] = useAuth();
  
  return (
    <div>
      <div data-testid="user">{auth?.user ? JSON.stringify(auth.user) : "no user"}</div>
      <div data-testid="token">{auth?.token || "no token"}</div>
      <button 
        data-testid="login-button" 
        onClick={() => 
          setAuth({ 
            user: { name: "Test User", email: "test@example.com" }, 
            token: "test-token" 
          })
        }
      >
        Login
      </button>
      <button 
        data-testid="logout-button" 
        onClick={() => 
          setAuth({
            user: null,
            token: "",
          })
        }
      >
        Logout
      </button>
    </div>
  );
};

describe("AuthProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it("should render children properly", () => {
    const { getByText } = render(
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>
    );

    expect(getByText("Test Child")).toBeInTheDocument();
  });

  it("should provide initial auth state with no user and empty token", () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId("user")).toHaveTextContent("no user");
    expect(getByTestId("token")).toHaveTextContent("no token");
  });

  it("should allow updating auth state", () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      getByTestId("login-button").click();
    });

    expect(getByTestId("user")).toHaveTextContent("Test User");
    expect(getByTestId("token")).toHaveTextContent("test-token");
  });

  it("should load auth state from localStorage on mount", () => {
    const userData = {
      user: { name: "Stored User", email: "stored@example.com" },
      token: "stored-token",
    };
    
    window.localStorage.getItem.mockReturnValueOnce(JSON.stringify(userData));

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(window.localStorage.getItem).toHaveBeenCalledWith("auth");
    expect(getByTestId("user")).toHaveTextContent("Stored User");
    expect(getByTestId("token")).toHaveTextContent("stored-token");
  });

  it("should set axios authorization header when token is available", () => {
    const userData = {
      user: { name: "Axios User", email: "axios@example.com" },
      token: "axios-token",
    };
    
    window.localStorage.getItem.mockReturnValueOnce(JSON.stringify(userData));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(axios.defaults.headers.common["Authorization"]).toBe("axios-token");
  });

  it("should correctly handles empty or invalid localStorage data", () => {
    window.localStorage.getItem.mockReturnValueOnce(null);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId("user")).toHaveTextContent("no user");
    expect(getByTestId("token")).toHaveTextContent("no token");
  });

  it("should allow logging out by clearing auth state", () => {
    const userData = {
      user: { name: "Initial User", email: "initial@example.com" },
      token: "initial-token",
    };
    
    window.localStorage.getItem.mockReturnValueOnce(JSON.stringify(userData));

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId("user")).toHaveTextContent("Initial User");
    expect(getByTestId("token")).toHaveTextContent("initial-token");

    act(() => {
      getByTestId("logout-button").click();
    });

    expect(getByTestId("user")).toHaveTextContent("no user");
    expect(getByTestId("token")).toHaveTextContent("no token");
  });
});