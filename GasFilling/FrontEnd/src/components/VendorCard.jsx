import { MapPin, Navigation, Check, Phone } from "lucide-react";

function VendorCard({ vendor, onSelect }) {
  return (
    <div className="vendor-card">

      <div className="vendor-card-header">
        <div>
          <h3>{vendor.Vendor.Name}</h3>
          <p style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={13} /> {vendor.Vendor.Address}
          </p>
        </div>
        <span className="distance-badge" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Navigation size={12} /> {vendor.DistanceKm.toFixed(2)} km away
        </span>
      </div>

      <div className="vendor-info">
        <div>
          <span>Gas Amount</span>
          <strong>{vendor.WeightKg} KG</strong>
        </div>
        <div>
          <span>Price / KG</span>
          <strong>₦{vendor.PricePerKg.toLocaleString()}</strong>
        </div>
        <div>
          <span>Total Cost</span>
          <strong style={{ color: "var(--accent)" }}>
            ₦{vendor.TotalGasCost.toLocaleString()}
          </strong>
        </div>
        {vendor.Vendor.Phone && (
          <div>
            <span>Phone</span>
            <strong>{vendor.Vendor.Phone}</strong>
          </div>
        )}
      </div>

      <div className="vendor-actions">
        <button
          className="primary-button"
          onClick={() => onSelect(vendor)}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Check size={16} /> Select Vendor
        </button>
        <a
          href={`tel:${vendor.Vendor.Phone}`}
          className="secondary-button"
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Phone size={16} /> Call Vendor
        </a>
      </div>

    </div>
  );
}

export default VendorCard;