import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomePage from "../pages/HomePage";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";

jest.mock("axios");

jest.mock("../context/auth", () => ({
  useAuth: () => [null, jest.fn()]
}));

const mockSetCart = jest.fn();
jest.mock("../context/cart", () => ({
  useCart: jest.fn().mockImplementation(() => {
    return [[], mockSetCart];
  })
}));

jest.mock("../hooks/useCategory", () => () => []);

jest.mock("../context/search", () => ({
  useSearch: () => [{ keyword: "" }, jest.fn()]
}));

jest.mock("../components/Layout", () => {
  return function DummyLayout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

describe("HomePage Component", () => {
  const sampleProducts = [
    {
      category: "electronics-category-id", 
      createdAt: "2023-06-06T18:47:23.876B",
      description: "smartphone with 5G support",
      name: "iPhone 15 Pro",
      price: 846,
      quantity: 50,
      shipping: true,
      slug: "iphone-15-pro",
      updatedAt: "2024-04-12T04:32:19.929H",
      __v: 0,
      _id: "product-1"
    },
    {
      category: "electronics-category-id", 
      createdAt: "2023-06-06T18:47:23.876B",
      description: "lightweight device",
      name: "iPad Air",
      price: 599.99,
      quantity: 75,
      shipping: true,
      slug: "ipad-air",
      updatedAt: "2024-04-12T04:32:19.929H",
      __v: 0,
      _id: "product-2"
    },
  ];

  // Sample categories data for tests
  const sampleCategories = [
    { name: "Electronics", slug: "electronics", _id: "electronics-category-id" }, 
    { name: "Home & Kitchen", slug: "home-kitchen", _id: "home-kitchen-category-id" }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Clear any previous calls to mockSetCart
    mockSetCart.mockClear();
  });

  it("should render the homepage with correct title", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const layout = screen.getByTestId("layout");
    expect(layout).toHaveAttribute("data-title", "ALL Products - Best offers");
  });

  it("should display the banner image", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const bannerImage = screen.getByAltText("bannerimage");
    expect(bannerImage).toBeInTheDocument();
    expect(bannerImage).toHaveAttribute("src", "/images/Virtual.png");
  });

  it("should display category filter section", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText("Filter By Category")).toBeInTheDocument();
  });

  it("should display products section title", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText("All Products")).toBeInTheDocument();
  });

  it("should fetch and display categories on mount", async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        message: "All Categories List",
        category: sampleCategories,
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Home & Kitchen")).toBeInTheDocument();
    });
  });

  it("should handle category API error", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      expect(screen.queryByRole("checkbox", { name: "Electronics" })).not.toBeInTheDocument();
    });
  });

  it("should handle category filter selection", async () => {
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        message: "All Categories List",
        category: sampleCategories,
      },
    });
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        counTotal: 10,
        message: "All Products",
        products: sampleProducts,
      },
    });
    
    axios.get.mockResolvedValueOnce({ 
      data: {
        success: true,
        total: 10
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-count");
    });

    const categoryCheckbox = await screen.findByText("Electronics");
    expect(categoryCheckbox).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole("checkbox", { name: "Electronics" }));
    
    // Verify the checked state of the checkbox
    expect(screen.getByRole("checkbox", { name: "Electronics" })).toBeChecked();
  });

  it("should fetch and display products on mount", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        products: sampleProducts,
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("iPhone 15 Pro")).toBeInTheDocument();
      expect(screen.getByText("iPad Air")).toBeInTheDocument();
    });
  });

  it("should handle products API error", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
      expect(screen.queryByText("iPhone 15 Pro")).not.toBeInTheDocument();
    });
  });

  it("should ensure correct price filter selection", async () => {
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: [] },
    });
    
    axios.post.mockResolvedValueOnce({
      data: { 
        success: true, 
        products: [{
          category: "books-category-id", 
          createdAt: "2024-09-06T17:57:19.978Z",
          description: "Best-selling fiction novel",
          name: "The Silent Echo",
          price: 29.99,
          quantity: 100,
          shipping: true,
          slug: "silent-echo",
          updatedAt: "2025-03-09T03:57:50.399Z",
          __v: 0,
          _id: "book-1"
        }] 
      },
    });
    
    // Mock filter API response for $0-19 price range (empty results)
    axios.post.mockResolvedValueOnce({
      data: { success: true, products: [] },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(await screen.findByText("Filter By Price")).toBeInTheDocument();

    // Select $20-39 price range
    fireEvent.click(screen.getByLabelText("$20 to 39"));

    await waitFor(() => {
      expect(screen.getByText("The Silent Echo")).toBeInTheDocument();
    });

    // Switch to $0-19 price range
    fireEvent.click(screen.getByLabelText("$0 to 19"));

    await waitFor(() => {
      expect(screen.queryByText("The Silent Echo")).not.toBeInTheDocument();
    });
  });

  it("should add a product to cart when clicking 'ADD TO CART' button", async () => {
    mockSetCart.mockClear();
    
    axios.get.mockResolvedValue({
      data: {
        success: true,
        products: [sampleProducts[0]],
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("iPhone 15 Pro")).toBeInTheDocument();
    });

    fireEvent.click(await screen.findByRole("button", { name: /ADD TO CART/i }));

    expect(mockSetCart).toHaveBeenCalledTimes(1);
    expect(mockSetCart).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: "iPhone 15 Pro",
          price: 846,
          _id: "product-1"
        })
      ])
    );
  });

  it("should have a 'More Details' button that navigates to product page", async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        products: [sampleProducts[0]],
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("iPhone 15 Pro")).toBeInTheDocument();
    });

    const moreDetailsButton = await screen.findByRole("button", { name: /More Details/i });
    expect(moreDetailsButton).toBeInTheDocument();
  });

  it("should display 'Loadmore' button when there are more products to load", async () => {
    // Mock product list API response with fewer products than total
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        products: [sampleProducts[0]],
      },
    });
    
    // Mock product count API response with higher total
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        total: 10
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const loadMoreButton = screen.getByText("Loadmore");
      expect(loadMoreButton).toBeInTheDocument();
    });
  });

  it("should reset filters correctly", async () => {
    axios.get.mockReset();
    axios.post.mockReset();
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        message: "All Categories List",
        category: sampleCategories,
      },
    });
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: sampleProducts,
      },
    });
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        total: 10,
      },
    });
    
    axios.post.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: [sampleProducts[0]],
      },
    });
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: sampleProducts,
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });
    
    const categoryCheckbox = screen.getByRole("checkbox", { name: "Electronics" });
    fireEvent.click(categoryCheckbox);
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          checked: expect.arrayContaining(["electronics-category-id"]),
          radio: []
        })
      );
    });
    
    const resetButton = screen.getByRole("button", { name: /RESET FILTERS/i });
    fireEvent.click(resetButton);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });
    
    expect(screen.getByText("Filter By Category")).toBeInTheDocument();
    expect(screen.getByText("All Products")).toBeInTheDocument();
  });

  it("should handle pagination correctly when clicking 'Loadmore'", async () => {
    axios.get.mockReset();
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: [sampleProducts[0]],
      },
    });
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        total: 10,
      },
    });
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: [sampleProducts[1]],
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-count");
    });
    
    const loadMoreButton = await screen.findByText("Loadmore");
    expect(loadMoreButton).toBeInTheDocument();
    
    fireEvent.click(loadMoreButton);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/2");
    });
    
    expect(screen.getByText("All Products")).toBeInTheDocument();
    expect(screen.getByText("Filter By Category")).toBeInTheDocument();
  });

  it("should handle loadmore API error gracefully", async () => {
    axios.get.mockReset();
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: [sampleProducts[0]],
      },
    });
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        total: 10
      },
    });
    
    axios.get.mockRejectedValueOnce(new Error("Network error loading more products"));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-count");
    });
    
    const loadMoreButton = await screen.findByText("Loadmore");
    expect(loadMoreButton).toBeInTheDocument();
    
    fireEvent.click(loadMoreButton);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/2");
    });
    
   
    await waitFor(() => {
      expect(screen.getByText("Loadmore")).toBeInTheDocument();
    });
  });

  it("should handle product count API error gracefully", async () => {
    axios.get.mockReset();
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        message: "All Categories List",
        category: sampleCategories,
      },
    });
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: sampleProducts,
      },
    });
    
    axios.get.mockRejectedValueOnce(new Error("Failed to get product count"));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-count");
    });

    expect(screen.getByText("All Products")).toBeInTheDocument();
    expect(screen.getByText("Filter By Category")).toBeInTheDocument();
  });

  // Test Case 1: Apply category filter only
  it("should filter products by category", async () => {
    axios.get.mockReset();
    axios.post.mockReset();
    
    // Mock categories data
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        message: "All Categories List",
        category: sampleCategories,
      },
    });
    
    // Mock products data
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: sampleProducts,
      },
    });
    
    // Mock count data
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        total: 2
      }
    });
    
    // Mock filtered products by category
    axios.post.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: [sampleProducts[0]],
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });
    
    // Apply category filter
    fireEvent.click(screen.getByRole("checkbox", { name: "Electronics" }));
    
    // Verify filter API was called with correct category
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          checked: expect.arrayContaining(["electronics-category-id"]),
          radio: []
        })
      );
    });
  });

  // Test Case 2: Apply price filter only
  it("should filter products by price range", async () => {
    axios.get.mockReset();
    axios.post.mockReset();
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        message: "All Categories List",
        category: sampleCategories,
      },
    });
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: sampleProducts,
      },
    });
    
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        total: 2
      }
    });
    
    axios.post.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: [sampleProducts[1]], // Only one product in this price range
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Filter By Price")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByLabelText("$40 to 59"));
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          checked: [],
          radio: expect.anything()
        })
      );
    });
  });

  // Test Case 3: Apply both category and price filters
  it("should apply both category and price filters together", async () => {
    axios.get.mockReset();
    axios.post.mockReset();
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        message: "All Categories List",
        category: sampleCategories,
      },
    });
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: sampleProducts,
      },
    });
    
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        total: 2
      }
    });
    
    axios.post.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: [sampleProducts[0]],
      },
    });
    
    axios.post.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: [],
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole("checkbox", { name: "Electronics" }));
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          checked: expect.arrayContaining(["electronics-category-id"]),
          radio: []
        })
      );
    });
    
    fireEvent.click(screen.getByLabelText("$0 to 19"));
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          checked: expect.arrayContaining(["electronics-category-id"]),
          radio: expect.anything()
        })
      );
    });
  });

  // Test Case 4: Apply multiple category filters
  it("should handle multiple category filters", async () => {
    axios.get.mockReset();
    axios.post.mockReset();
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        message: "All Categories List",
        category: [
          ...sampleCategories,
          { name: "Books", slug: "books", _id: "books-category-id" }
        ],
      },
    });
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: sampleProducts,
      },
    });
    
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        total: 2
      }
    });
    
    axios.post.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: [sampleProducts[0]],
      },
    });
    
    axios.post.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: sampleProducts,
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
      expect(screen.getByText("Books")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole("checkbox", { name: "Electronics" }));
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          checked: expect.arrayContaining(["electronics-category-id"]),
          radio: []
        })
      );
    });
    
    fireEvent.click(screen.getByRole("checkbox", { name: "Books" }));
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          checked: expect.arrayContaining(["electronics-category-id", "books-category-id"]),
          radio: []
        })
      );
    });
  });

  // Test Case 5: Remove a category filter
  it("should remove a category filter when unchecking box", async () => {
    axios.get.mockReset();
    axios.post.mockReset();
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        message: "All Categories List",
        category: sampleCategories,
      },
    });
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: sampleProducts,
      },
    });
    
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        total: 2
      }
    });
    
    axios.post.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: [sampleProducts[0]],
      },
    });
    
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true,
        products: sampleProducts,
      },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Electronics")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole("checkbox", { name: "Electronics" }));
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        expect.objectContaining({
          checked: expect.arrayContaining(["electronics-category-id"]),
          radio: []
        })
      );
    });
    
    fireEvent.click(screen.getByRole("checkbox", { name: "Electronics" }));
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });
  });

});