import { useState } from "react";
import { Search } from "lucide-react";
import "./SearchBar.css";

export default function SearchBar() {
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([50000, 500000]); // min and max values

  const toggleFilters = () => setShowFilters(!showFilters);

  return (
    <div className="search-wrapper">
      <button className="search-trigger" onClick={toggleFilters}>
        <Search size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Search Property
      </button>

      <div className={`filter-panel ${showFilters ? "open" : ""}`}>
        <div className="filter-item">
          <label>Location</label>
          <input type="text" placeholder="e.g. Lekki, Lagos" />
        </div>

        <div className="filter-item">
          <label>Property Type</label>
          <select>
            <option>All</option>
            <option>Apartment</option>
            <option>Duplex</option>
            <option>Land</option>
            <option>Commercial</option>
          </select>
        </div>

        <div className="filter-item range-filter">
          <label>Price Range (${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()})</label>
          <input
            type="range"
            min="10000"
            max="1000000"
            step="10000"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
          />
          <input
            type="range"
            min="10000"
            max="1000000"
            step="10000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
          />
        </div>

        <button className="apply-btn">Apply Filters</button>
      </div>
    </div>
  );
}
