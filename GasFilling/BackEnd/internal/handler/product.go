package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"gasfill/internal/product"
)

type ProductHandler struct {
	productService *product.Service
}

func NewProductHandler(productService *product.Service) *ProductHandler {
	return &ProductHandler{
		productService: productService,
	}
}

type CreateProductRequest struct {
	VendorID    string              `json:"vendorId"`
	Name        string              `json:"name"`
	Type        product.ProductType `json:"type"`
	Description string              `json:"description"`
	WeightKg    float64             `json:"weightKg"`
	Price       float64             `json:"price"`
	Available   bool                `json:"available"`
}

func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateProductRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	newProd, err := h.productService.AddProduct(
		req.VendorID,
		req.Name,
		req.Type,
		req.Description,
		req.WeightKg,
		req.Price,
		req.Available,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"product": newProd,
	})
}

func (h *ProductHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	productType := r.URL.Query().Get("type")

	var productsList []product.Product

	if productType != "" {
		productsList = h.productService.GetProductsByType(product.ProductType(productType))
	} else {
		productsList = h.productService.GetAllProducts()
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"products": productsList,
	})
}

func (h *ProductHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/products/")

	prod, err := h.productService.GetProductByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, prod)
}

func (h *ProductHandler) VendorProducts(w http.ResponseWriter, r *http.Request) {
	vendorID := strings.TrimPrefix(r.URL.Path, "/api/products/vendor/")

	productsList := h.productService.GetVendorProducts(vendorID)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"products": productsList,
	})
}
