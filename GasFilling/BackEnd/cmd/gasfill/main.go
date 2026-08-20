package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

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

	fileServer := http.FileServer(http.Dir(frontendPath))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Block /api/ paths from accidentally serving the frontend
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		// Clean and trim the requested path before joining with frontendPath.
		// r.URL.Path may start with '/', and filepath.Join(frontendPath, "/index.html")
		// would treat "/index.html" as absolute and ignore frontendPath.
		cleanPath := strings.TrimPrefix(filepath.Clean(r.URL.Path), "/")
		filePath := filepath.Join(frontendPath, cleanPath)

		// If the path is not just the root, check if the file exists and serve it.
		if r.URL.Path != "/" {
			if _, err := os.Stat(filePath); err == nil {
				// Serve the static file
				fileServer.ServeHTTP(w, r)
				return
			}
		}

		// Otherwise always serve index.html (SPA fallback)
		http.ServeFile(w, r, filepath.Join(frontendPath, "index.html"))
	})

	// ==========================================
	// START SERVER (with PORT env and graceful shutdown)
	// ==========================================
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := ":" + port

	log.Println("========================================")
	log.Println("GasFill API + Frontend")
	log.Printf("Running on http://localhost%s\n", addr)
	log.Println("========================================")

	srv := &http.Server{
		Addr:    addr,
		Handler: handler.EnableCORS(mux),
	}

	// run server in goroutine so we can gracefully shutdown
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %v\n", err)
		}
	}()

	// wait for interrupt
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit
	log.Println("Shutdown signal received, shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited properly")
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
