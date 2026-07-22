import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="page">
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <span className="hero-tag">🔥 On-Demand Cooking Gas Platform</span>
            <h1>
              Cooking gas delivered <br />
              <span>to your doorstep.</span>
            </h1>
            <p>
              GasFill connects households with verified local gas vendors and fast delivery riders. Refill your cylinder, buy filled gas, or order new cylinders hassle-free.
            </p>
            <div className="hero-actions">
              <Link to="/refill" className="btn btn-primary btn-lg">
                Refill Gas Now
              </Link>
              <Link to="/buy-gas" className="btn btn-secondary btn-lg">
                Buy Filled Gas →
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-value">500+</div>
                <div className="hero-stat-label">Verified Vendors</div>
              </div>
              <div>
                <div className="hero-stat-value">1,200+</div>
                <div className="hero-stat-label">Active Delivery Riders</div>
              </div>
              <div>
                <div className="hero-stat-value">30 mins</div>
                <div className="hero-stat-label">Average Delivery</div>
              </div>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-illustration">🛢️</div>
          </div>
        </div>
      </section>

      {/* ===== PORTALS / ROLES SECTION ===== */}
      <section className="section section-white">
        <div className="container">
          <div className="section-head">
            <span className="tag">PLATFORM ROLES</span>
            <h2>Built for Everyone in the Supply Chain</h2>
            <p>Select your portal to manage your gas orders, store inventory, or delivery jobs.</p>
          </div>

          <div className="role-grid">
            {/* Customer Role */}
            <div className="role-card">
              <div className="role-icon role-icon-customer">🛍️</div>
              <h3>Customer Portal</h3>
              <p>For homes and businesses needing cooking gas refilled or delivered fast.</p>
              <ul className="role-features">
                <li>Find nearby gas stations</li>
                <li>Compare prices per KG</li>
                <li>Track live delivery status</li>
              </ul>
              <Link to="/dashboard" className="btn btn-primary btn-full">
                Customer Dashboard →
              </Link>
            </div>

            {/* Vendor Role */}
            <div className="role-card">
              <div className="role-icon role-icon-vendor">🏪</div>
              <h3>Vendor Portal</h3>
              <p>For LPG gas plant owners, refilling stations, and cylinder retailers.</p>
              <ul className="role-features">
                <li>Manage gas inventory & price/kg</li>
                <li>Receive automated customer orders</li>
                <li>Track sales & earnings</li>
              </ul>
              <Link to="/vendor-dashboard" className="btn btn-secondary btn-full">
                Vendor Dashboard →
              </Link>
            </div>

            {/* Rider Role */}
            <div className="role-card">
              <div className="role-icon role-icon-rider">🛵</div>
              <h3>Rider Portal</h3>
              <p>For logistics dispatch riders and gas delivery drivers.</p>
              <ul className="role-features">
                <li>Accept pickup & delivery tasks</li>
                <li>Optimized navigation routes</li>
                <li>Earn per completed delivery</li>
              </ul>
              <Link to="/rider-dashboard" className="btn btn-secondary btn-full">
                Rider Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-head">
            <span className="tag">OUR SERVICES</span>
            <h2>Fast Cooking Gas Solutions</h2>
            <p>Everything you need to keep your home or kitchen running smoothly.</p>
          </div>

          <div className="service-grid">
            <div className="service-card">
              <div className="service-icon">🔄</div>
              <h3>Gas Cylinder Refill</h3>
              <p>Enter your location and cylinder weight. We'll match you with the closest vendor for instant refill pickup or delivery.</p>
              <Link to="/refill">Refill Gas Now →</Link>
            </div>

            <div className="service-card">
              <div className="service-icon">🛢️</div>
              <h3>Buy Filled Cylinder</h3>
              <p>Order pre-filled gas cylinders in 3kg, 6kg, 12.5kg, or 25kg sizes with safety seal guaranteed.</p>
              <Link to="/buy-gas">Browse Products →</Link>
            </div>

            <div className="service-card">
              <div className="service-icon">🏭</div>
              <h3>Buy New Cylinder</h3>
              <p>Purchase brand new high-quality steel LPG cylinders tested and certified for safety.</p>
              <Link to="/buy-cylinder">Browse Cylinders →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand">🔥 Gas<span>Fill</span></div>
            <p>Connecting households, gas vendors, and delivery riders across Nigeria.</p>
          </div>
          <div className="footer-col">
            <h4>Portals</h4>
            <ul>
              <li><Link to="/dashboard">Customer Portal</Link></li>
              <li><Link to="/vendor-dashboard">Vendor Portal</Link></li>
              <li><Link to="/rider-dashboard">Rider Portal</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Services</h4>
            <ul>
              <li><Link to="/refill">Refill Gas</Link></li>
              <li><Link to="/buy-gas">Buy Gas</Link></li>
              <li><Link to="/buy-cylinder">Buy Cylinder</Link></li>
              <li><Link to="/track-order">Track Order</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><a href="#help">Help Center</a></li>
              <li><a href="#contact">Contact Support</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 GasFill Technology Ltd. All rights reserved.</p>
          <p>LPG Gas Filling & Logistics Solution</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;