import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import UpdateProduct from "./UpdateProduct";

// Mocking dependent modules
jest.mock("axios");
jest.mock("react-hot-toast");

// Mock navigate function and useParams
const mockNavigate = jest.fn();
const mockParams = { slug: "test-product" };
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

// Mock contexts and hooks
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "mocked-object-url");

// Mock window.confirm for delete confirmation
global.window.confirm = jest.fn(() => true);

jest.mock("antd", () => ({
  ...jest.requireActual("antd"),
  Select: ({ value, onChange, "data-testid": testId, children }) => {
    let options = [];

    if (testId === "select-category") {
      options = [
        <option key="1" value="1">Electronics</option>,
        <option key="2" value="2">Books</option>,
      ];
    } else if (testId === "select-shipping") {
      options = [
        <option key="yes" value="1">Yes</option>,
        <option key="no" value="0">No</option>,
      ];
    }

    return (
      <select
        data-testid={testId || "select"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options}
      </select>
    );
  },
}));

describe("UpdateProduct Component", () => {
  const mockCategories = [
    { _id: "1", name: "Electronics", slug: "electronics" },
    { _id: "2", name: "Books", slug: "books" }
  ];

  const mockProduct = {
    _id: "123",
    name: "Test Product",
    description: "Test Description",
    price: 99.99,
    quantity: 10,
    category: { _id: "1", name: "Electronics" },
    shipping: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up default axios mocks
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.resolve({
          data: {
            success: true,
            category: mockCategories
          }
        });
      } else if (url.includes("/api/v1/product/get-product/")) {
        return Promise.resolve({
          data: {
            success: true,
            product: mockProduct
          }
        });
      }
      return Promise.reject(new Error("Not mocked"));
    });
  });

  it("renders update product form with product data", async () => {
    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    // Wait for product and categories to load
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

    // Check for key elements and loaded values
    expect(screen.getByText("Update Product")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByPlaceholderText("write a name").value).toBe("Test Product");
      expect(screen.getByPlaceholderText("write a description").value).toBe("Test Description");
      expect(screen.getByPlaceholderText("write a Price").value).toBe("99.99");
      expect(screen.getByPlaceholderText("write a quantity").value).toBe("10");
      expect(screen.getByTestId("select-category").value).toBe("1");
      expect(screen.getByTestId("select-shipping").value).toBe("1");
    });

    // Check buttons
    expect(screen.getByText("UPDATE PRODUCT")).toBeInTheDocument();
    expect(screen.getByText("DELETE PRODUCT")).toBeInTheDocument();
  });

  it("should handle product fetch error", async () => {
    // Override the product fetch mock to simulate an error
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/product/get-product/")) {
        return Promise.reject(new Error("Failed to fetch product"));
      }
      return Promise.resolve({
        data: {
          success: true,
          category: mockCategories
        }
      });
    });

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error fetching product");
    });
  });

  it("should handle case when product is not found", async () => {
    // Mock product not found response
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/product/get-product/")) {
        return Promise.resolve({
          data: {
            success: true,
            product: null
          }
        });
      }
      return Promise.resolve({
        data: {
          success: true,
          category: mockCategories
        }
      });
    });

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Product not found");
    });
  });

  it("should handle category fetch error", async () => {
    // Override the category fetch mock to simulate an error
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/category/get-category")) {
        return Promise.reject(new Error("Failed to fetch categories"));
      }
      return Promise.resolve({
        data: {
          success: true,
          product: mockProduct
        }
      });
    });

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category");
    });
  });

  it("inputs should accept and store new values", async () => {
    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    // Wait for component to fully load with data
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

    // Change form input values
    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "Updated Product Name" }
    });

    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "Updated product description" }
    });

    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "199.99" }
    });

    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "20" }
    });

    // Verify values were updated
    expect(screen.getByPlaceholderText("write a name").value).toBe("Updated Product Name");
    expect(screen.getByPlaceholderText("write a description").value).toBe("Updated product description");
    expect(screen.getByPlaceholderText("write a Price").value).toBe("199.99");
    expect(screen.getByPlaceholderText("write a quantity").value).toBe("20");
  });

  it("should show validation error when required fields are missing", async () => {
    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    // Wait for component to load data
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

    // Clear required fields
    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "" }
    });

    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "" }
    });

    // Try to update product with missing fields
    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    // Check for validation error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Name, Description, Price, Quantity and Category is required"
      );
    });
  });

  it("should handle successful product update", async () => {
    // Mock successful API response for product update
    axios.put.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Product Updated Successfully",
      }
    });

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    // Wait for component to load data
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

    // Update a field
    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "Updated Product Name" }
    });

    // Select different shipping option
    const shippingSelect = screen.getByTestId("select-shipping");
    fireEvent.change(shippingSelect, { target: { value: "0" } });

    const categorySelect = screen.getByTestId("select-category");
    fireEvent.change(categorySelect, { target: { value: "1" } });

    // Trigger update action
    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    // Wait for the PUT request and success message
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });
  });

  it("should handle API error during product update", async () => {
    // Mock API error for update
    axios.put.mockRejectedValue(new Error("Server error"));

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    // Wait for component to load data
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("write a name").value).toBe("Test Product");
      expect(screen.getByPlaceholderText("write a description").value).toBe("Test Description");
      expect(screen.getByPlaceholderText("write a Price").value).toBe("99.99");
      expect(screen.getByPlaceholderText("write a quantity").value).toBe("10");
    });

    // Trigger update action
    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    // Check for error message
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });
  });

  it("should handle failed update response", async () => {
    // Mock API response with success=false
    axios.put.mockResolvedValueOnce({
      data: {
        success: false,
        message: "Product with this name already exists",
      }
    });

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    // Wait for component to load data
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

    // Update a field
    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "Existing Product Name" }
    });

    // Trigger update action
    fireEvent.click(screen.getByText("UPDATE PRODUCT"));

    // Check for the error message from the API response
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Product with this name already exists");
    });

    // Verify that navigation didn't happen
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should handle photo upload and display preview", async () => {
    const { container } = render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    // Wait for component to fully load with data
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

    // Create a mock file
    const file = new File(['dummy content'], 'new-product-image.png', { type: 'image/png' });

    // Get the file input
    const fileInput = container.querySelector('input[type="file"]');

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Check that the upload label now shows the file name
    expect(screen.getByText('new-product-image.png')).toBeInTheDocument();

    // Check that the image preview uses the new file
    const images = screen.getAllByAltText('product_photo');
    // The first image should be from the newly selected file
    expect(images[0]).toHaveAttribute('src', 'mocked-object-url');
  });

  it("should handle successful product delete", async () => {
    // Mock successful API response for product delete
    axios.delete.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Product Deleted Successfully",
      }
    });

    // Mock confirmation to be true
    window.confirm.mockImplementationOnce(() => true);

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    // Wait for component to load data
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

    // Trigger delete action
    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    // Check that confirmation was requested
    expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to delete this product?");

    // Wait for the DELETE request and success message
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });
  });

  it("should not delete product when user cancels confirmation", async () => {
    // Mock confirmation to be false (user cancels)
    window.confirm.mockImplementationOnce(() => false);

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    // Wait for component to load data
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

    // Trigger delete action
    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    // Check that confirmation was requested
    expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to delete this product?");

    // Verify delete request was not made
    expect(axios.delete).not.toHaveBeenCalled();
  });

  it("should handle API error during product delete", async () => {
    // Mock API error for delete
    axios.delete.mockRejectedValue(new Error("Server error"));

    // Mock confirmation to be true
    window.confirm.mockImplementationOnce(() => true);

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    // Wait for component to load data
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

    // Trigger delete action
    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    // Check for error message
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });

  it("should handle failed delete response", async () => {
    // Mock API response with success=false
    axios.delete.mockResolvedValueOnce({
      data: {
        success: false,
        message: "Cannot delete product with active orders",
      }
    });

    // Mock confirmation to be true
    window.confirm.mockImplementationOnce(() => true);

    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

    // Wait for component to load data
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

    // Trigger delete action
    fireEvent.click(screen.getByText("DELETE PRODUCT"));

    // Check for the error message from the API response
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Cannot delete product with active orders");
    });

    // Verify that navigation didn't happen
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
