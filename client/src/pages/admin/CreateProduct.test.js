import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";


jest.mock("axios");
jest.mock("react-hot-toast");


const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));


jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]) 
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]) 
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) 
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));


global.URL.createObjectURL = jest.fn(() => "mocked-object-url");

jest.mock("antd", () => ({
  ...jest.requireActual("antd"),
  Select: ({ value, onChange, "data-testid": testId }) => {
    let options = [];

    if (testId === "select-category") {
      options = [
        <option key="1" value="1">
          Electronics
        </option>,
        <option key="2" value="2">
          Books
        </option>,
      ];
    } else if (testId === "select-shipping") {
      options = [
        <option key="yes" value="1">
          Yes
        </option>,
        <option key="no" value="0">
          No
        </option>,
      ];
    }

    return (
      <select
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options}
      </select>
    );
  },
}));

describe("CreateProduct Component", () => {
  const mockCategories = [
    { _id: "1", name: "Electronics", slug: "electronics" },
    { _id: "2", name: "Books", slug: "books" }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    axios.get.mockResolvedValue({
      data: {
        success: true,
        category: mockCategories
      }
    });
  });

  it("renders create product form", async () => {
    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    expect(screen.getByPlaceholderText("write a name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("write a description")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("write a Price")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("write a quantity")).toBeInTheDocument();
    expect(screen.getByText("Upload Photo")).toBeInTheDocument();
    expect(screen.getByTestId("select-category")).toBeInTheDocument();
    expect(screen.getByTestId("select-shipping")).toBeInTheDocument();
    expect(screen.getByText("CREATE PRODUCT")).toBeInTheDocument();
  });

  it("inputs should accept and store values", async () => {
    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "Test Product" }
    });

    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "This is a test product description" }
    });

    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "99.99" }
    });

    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "10" }
    });

    expect(screen.getByPlaceholderText("write a name").value).toBe("Test Product");
    expect(screen.getByPlaceholderText("write a description").value).toBe("This is a test product description");
    expect(screen.getByPlaceholderText("write a Price").value).toBe("99.99");
    expect(screen.getByPlaceholderText("write a quantity").value).toBe("10");
  });

  it("should show validation error when required fields are missing", async () => {
    
    jest.clearAllMocks();

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    
    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    
    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Name, Description, Price, Quantity and Category is required"
      );
    });
  });

  it("should handle successful product creation", async () => {
    
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: "Product Created Successfully",
      }
    });

    const { getByRole, getByPlaceholderText, getByText, getByTestId } = render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    
    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    
    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "New Product" }
    });

    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "Product description" }
    });

    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "29.99" }
    });

    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "50" }
    });

    const categorySelect = getByTestId("select-category");
    fireEvent.change(categorySelect, { target: { value: "2" } });
    expect(categorySelect).toHaveValue("2");

    const shippingSelect = getByTestId("select-shipping");
    fireEvent.change(shippingSelect, { target: { value: "1" } });
    expect(shippingSelect).toHaveValue("1");

    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });
  });

  it("should handle API error during product creation", async () => {
    
    axios.post.mockRejectedValue({ message: "Server error" });

    const { getByRole, getByPlaceholderText, getByText, getByTestId } = render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    
    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    
    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "Test Product" }
    });

    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "Test Description" }
    });

    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "99.99" }
    });

    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "10" }
    });

    const categorySelect = getByTestId("select-category");
    fireEvent.change(categorySelect, { target: { value: "2" } });
    expect(categorySelect).toHaveValue("2");

    const shippingSelect = getByTestId("select-shipping");
    fireEvent.change(shippingSelect, { target: { value: "0" } });
    expect(shippingSelect).toHaveValue("0");

    
    fireEvent.click(screen.getByText("CREATE PRODUCT"));

    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });

    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });
  });

  it("should handle category fetch error", async () => {
    
    jest.clearAllMocks();

    
    axios.get.mockRejectedValueOnce({ message: "Failed to fetch categories" });

    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );

    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category");
    });
  });

  it("should handle photo upload and display preview", async () => {
    const { container } = render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );
  
    
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  
    
    const file = new File(['dummy content'], 'test-image.png', { type: 'image/png' });
    
    
    const fileInput = container.querySelector('input[type="file"]');
    
    
    fireEvent.change(fileInput, { target: { files: [file] } });
  
    
    const previewImage = await screen.findByAltText('product_photo');
    expect(previewImage).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(previewImage).toHaveAttribute('src', 'mocked-object-url');
  
    
    expect(screen.getByText('test-image.png')).toBeInTheDocument();
  });
  
  it("should handle API response with success=false", async () => {
    
    axios.post.mockResolvedValueOnce({
      data: {
        success: false,
        message: "Product name already exists"
      }
    });
  
    render(
      <MemoryRouter>
        <CreateProduct />
      </MemoryRouter>
    );
  
    
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  
    
    fireEvent.change(screen.getByPlaceholderText("write a name"), {
      target: { value: "Test Product" }
    });
  
    fireEvent.change(screen.getByPlaceholderText("write a description"), {
      target: { value: "Test Description" }
    });
  
    fireEvent.change(screen.getByPlaceholderText("write a Price"), {
      target: { value: "99.99" }
    });
  
    fireEvent.change(screen.getByPlaceholderText("write a quantity"), {
      target: { value: "10" }
    });
  
    
    const categorySelect = screen.getByTestId("select-category");
    fireEvent.change(categorySelect, { target: { value: "2" } });
  
    
    const shippingSelect = screen.getByTestId("select-shipping");
    fireEvent.change(shippingSelect, { target: { value: "0" } });
  
    
    fireEvent.click(screen.getByText("CREATE PRODUCT"));
  
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Product name already exists");
    });
  
    
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText("write a name").value).toBe("Test Product");
  });
});