package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"gasfill/internal/customer"
	"gasfill/internal/handler"
	"gasfill/internal/order"
	"gasfill/internal/product"
	"gasfill/internal/rider"
	"gasfill/internal/vendor"
)

func main() {

	// ==========================================
	// SERVICES
	// ==========================================

	customerService :=
		customer.NewService()

	vendorService :=
		vendor.NewService()

	productService :=
		product.NewService()

	orderService :=
		order.NewService()

	riderService :=
		rider.NewService()

	// ==========================================
	// SAMPLE DATA
	// ==========================================

	setupSampleVendors(
		vendorService,
		productService,
	)

	// ==========================================
	// HANDLERS
	// ==========================================

	customerHandler :=
		handler.NewCustomerHandler(
			customerService,
		)

	vendorHandler :=
		handler.NewVendorHandler(
			vendorService,
		)

	refillHandler :=
		handler.NewRefillHandler(
			vendorService,
		)

	productHandler :=
		handler.NewProductHandler(
			productService,
		)

	orderHandler :=
		handler.NewOrderHandler(
			orderService,
		)

	riderHandler :=
		handler.NewRiderHandler(
			riderService,
		)

	// ==========================================
	// ROUTER
	// ==========================================

	mux := http.NewServeMux()

	// ==========================================
	// HEALTH
	// ==========================================

	mux.HandleFunc(
		"/api/health",
		func(
			w http.ResponseWriter,
			r *http.Request,
		) {

			w.Header().Set(
				"Content-Type",
				"application/json",
			)

			json.NewEncoder(w).Encode(
				map[string]interface{}{
					"success": true,
					"service": "GasFill API",
					"status":  "running",
				},
			)
		},
	)

	// ==========================================
	// CUSTOMER
	// ==========================================

	mux.HandleFunc(
		"/api/customers/register",
		customerHandler.Register,
	)

	mux.HandleFunc(
		"/api/customers/login",
		customerHandler.Login,
	)

	mux.HandleFunc(
		"/api/customers",
		customerHandler.GetAll,
	)

	mux.HandleFunc(
		"/api/customers/",
		customerHandler.GetByID,
	)

	// ==========================================
	// VENDOR
	// ==========================================

	mux.HandleFunc(
		"/api/vendors/login",
		vendorHandler.Login,
	)

	mux.HandleFunc(
		"/api/vendors/nearby",
		refillHandler.FindNearbyVendors,
	)

	mux.HandleFunc(
		"/api/vendors",
		vendorHandler.GetAll,
	)

	mux.HandleFunc(
		"/api/vendors/",
		vendorHandler.GetByID,
	)

	// ==========================================
	// PRODUCTS
	// ==========================================

	mux.HandleFunc(
		"/api/products",
		func(
			w http.ResponseWriter,
			r *http.Request,
		) {

			if r.Method == http.MethodPost {
				productHandler.Create(
					w,
					r,
				)
				return
			}

			productHandler.GetAll(
				w,
				r,
			)
		},
	)

	mux.HandleFunc(
		"/api/products/vendor/",
		productHandler.VendorProducts,
	)

	mux.HandleFunc(
		"/api/products/",
		productHandler.GetByID,
	)

	// ==========================================
	// ORDERS
	// ==========================================

	mux.HandleFunc(
		"/api/orders/refill",
		orderHandler.CreateRefillOrder,
	)

	mux.HandleFunc(
		"/api/orders/customer/",
		orderHandler.GetCustomerOrders,
	)

	mux.HandleFunc(
		"/api/orders/vendor/",
		orderHandler.GetVendorOrders,
	)

	mux.HandleFunc(
		"/api/orders/",
		func(
			w http.ResponseWriter,
			r *http.Request,
		) {

			if strings.HasSuffix(
				r.URL.Path,
				"/status",
			) {

				orderHandler.UpdateStatus(
					w,
					r,
				)

				return
			}

			orderHandler.GetOrder(
				w,
				r,
			)
		},
	)

	// ==========================================
	// RIDERS
	// ==========================================

	mux.HandleFunc(
		"/api/riders/register",
		riderHandler.Register,
	)

	mux.HandleFunc(
		"/api/riders/login",
		riderHandler.Login,
	)

	mux.HandleFunc(
		"/api/riders",
		riderHandler.GetAll,
	)

	mux.HandleFunc(
		"/api/riders/",
		riderHandler.GetByID,
	)

	// ==========================================
	// FRONTEND
	// ==========================================

	frontendPath := "../FrontEnd/dist"
	if _, err := os.Stat(frontendPath); os.IsNotExist(err) {
		if _, err := os.Stat("./FrontEnd/dist"); err == nil {
			frontendPath = "./FrontEnd/dist"
		}
	}

	fileServer :=
		http.FileServer(
			http.Dir(frontendPath),
		)

	mux.HandleFunc(
		"/",
		func(
			w http.ResponseWriter,
			r *http.Request,
		) {

			if strings.HasPrefix(
				r.URL.Path,
				"/api/",
			) {

				http.NotFound(
					w,
					r,
				)

				return
			}

			filePath :=
				filepath.Join(
					frontendPath,
					r.URL.Path,
				)

			if r.URL.Path != "/" {

				if _, err :=
					os.Stat(filePath); err == nil {

					fileServer.ServeHTTP(
						w,
						r,
					)

					return
				}
			}

			http.ServeFile(
				w,
				r,
				filepath.Join(
					frontendPath,
					"index.html",
				),
			)
		},
	)

	// ==========================================
	// START SERVER
	// ==========================================

	log.Println(
		"========================================",
	)

	log.Println(
		"GasFill API + Frontend",
	)

	log.Println(
		"Running on http://localhost:8080",
	)

	log.Println(
		"========================================",
	)

	err := http.ListenAndServe(
		":8080",
		handler.EnableCORS(mux),
	)

	if err != nil {
		log.Fatal(err)
	}
}

func setupSampleVendors(
	vendorService *vendor.Service,
	productService *product.Service,
) {

	// ==========================================
	// VENDOR 1
	// ==========================================

	vendorOne :=
		vendorService.AddVendor(
			"ABC Gas Station",
			"08011111111",
			"abc@gasfill.com",
			"123456",
			"Aba Road",
			5.121,
			7.373,
		)

	// ==========================================
	// VENDOR 2
	// ==========================================

	vendorTwo :=
		vendorService.AddVendor(
			"XYZ LPG Depot",
			"08022222222",
			"xyz@gasfill.com",
			"123456",
			"Ikot Ekpene Road",
			5.115,
			7.390,
		)

	// ==========================================
	// VENDOR 3
	// ==========================================

	vendorThree :=
		vendorService.AddVendor(
			"Premium Gas Nigeria",
			"08033333333",
			"premium@gasfill.com",
			"123456",
			"Port Harcourt Road",
			5.140,
			7.350,
		)

	// ==========================================
	// GAS INVENTORY
	// ==========================================

	vendorService.AddInventory(
		vendorOne.ID,
		3,
		1200,
		true,
	)

	vendorService.AddInventory(
		vendorOne.ID,
		6,
		1200,
		true,
	)

	vendorService.AddInventory(
		vendorOne.ID,
		12.5,
		1200,
		true,
	)

	vendorService.AddInventory(
		vendorTwo.ID,
		6,
		1150,
		true,
	)

	vendorService.AddInventory(
		vendorTwo.ID,
		12.5,
		1150,
		true,
	)

	vendorService.AddInventory(
		vendorThree.ID,
		25,
		1100,
		true,
	)

	// ==========================================
	// PRODUCTS
	// ==========================================

	productService.AddProduct(
		vendorOne.ID,
		"3KG LPG Gas",
		product.ProductGas,
		"Premium LPG gas refill",
		3,
		3600,
		true,
	)

	productService.AddProduct(
		vendorOne.ID,
		"6KG LPG Gas",
		product.ProductGas,
		"Premium LPG gas refill",
		6,
		7200,
		true,
	)

	productService.AddProduct(
		vendorTwo.ID,
		"12.5KG LPG Gas",
		product.ProductGas,
		"Large LPG gas refill",
		12.5,
		14375,
		true,
	)

	productService.AddProduct(
		vendorThree.ID,
		"6KG Gas Cylinder",
		product.ProductCylinder,
		"Durable LPG gas cylinder",
		6,
		25000,
		true,
	)
}