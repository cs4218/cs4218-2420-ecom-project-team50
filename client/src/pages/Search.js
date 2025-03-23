import React from "react";
import Layout from "./../components/Layout";
import { useSearch } from "../context/search";
import { useNavigate } from "react-router-dom";

const Search = () => {
  const [values, setValues] = useSearch();
  const navigate = useNavigate();
  
  const products = values?.results?.results || [];
  const hasProducts = Array.isArray(products) && products.length > 0;
  
  return (
    <Layout title={"Search results"}>
      <div className="container">
        <div className="text-center">
          <h1>Search Results</h1>
          <h6>
            {!hasProducts
              ? "No Products Found"
              : `Found ${products.length} products`}
          </h6>
          <div className="d-flex flex-wrap mt-4">
            {hasProducts ? (
              products.map((p) => (
                <div key={p._id} className="card m-2" style={{ width: "18rem" }}>
                  <img
                    src={`/api/v1/product/product-photo/${p._id}`}
                    className="card-img-top"
                    alt={p.name}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{p.name}</h5>
                    <p className="card-text">
                      {p.description.substring(0, 30)}...
                    </p>
                    <p className="card-text"> $ {p.price}</p>
                    <button className="btn btn-primary ms-1" 
                    onClick={() => navigate(`/product/${p.slug}`)}>
                      More Details
                    </button>
                    <button className="btn btn-secondary ms-1">ADD TO CART</button>
                  </div>
                </div>
              ))
            ) : (
              <p>No search results to display</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;