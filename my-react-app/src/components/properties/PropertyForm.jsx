import React, { useState, useEffect, useRef } from 'react';
import { listingsService } from '../../services/api';
import './PropertyForm.css';

export function PropertyForm({ property, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    toilets: '',
    parking_spaces: '',
    land_size: '',
    property_type: 'apartment',
    listing_type: 'sale',
    status: 'draft',
    address: '',
    city: '',
    state: '',
    country: ''
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [validationErrors, setValidationErrors] = useState([]);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New images selected from computer
  const [selectedImages, setSelectedImages] = useState([]);

  // Preview URLs for newly selected images
  const [imagePreviews, setImagePreviews] = useState([]);

  // Existing images from database
  const [existingImages, setExistingImages] = useState([]);

  const fileInputRef = useRef(null);

  /*
   * Populate form when editing
   */
  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title || '',
        description: property.description || '',
        price: property.price || '',
        bedrooms:
          property.bedrooms !== null && property.bedrooms !== undefined
            ? property.bedrooms
            : '',
        bathrooms:
          property.bathrooms !== null && property.bathrooms !== undefined
            ? property.bathrooms
            : '',
        toilets:
          property.toilets !== null && property.toilets !== undefined
            ? property.toilets
            : '',
        parking_spaces:
          property.parking_spaces !== null &&
          property.parking_spaces !== undefined
            ? property.parking_spaces
            : '',
        land_size:
          property.land_size !== null &&
          property.land_size !== undefined
            ? property.land_size
            : '',
        property_type: property.property_type || 'apartment',
        listing_type: property.listing_type || 'sale',
        status: property.status || 'draft',
        address: property.address || '',
        city: property.city || '',
        state: property.state || '',
        country: property.country || ''
      });

      /*
       * Property details may contain images.
       * Support several possible backend response shapes.
       */
      const images =
        property.images ||
        property.listing_images ||
        [];

      setExistingImages(Array.isArray(images) ? images : []);
    } else {
      setExistingImages([]);
    }
  }, [property]);

  /*
   * Clean up preview URLs when component unmounts
   */
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setValidationErrors([]);
    setServerError('');
  };

  /*
   * Image selection
   */
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    const errors = [];

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];

    const MAX_SIZE = 5 * 1024 * 1024;

    const validFiles = [];

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(
          `${file.name}: Only JPG, PNG and WEBP images are allowed.`
        );
        return;
      }

      if (file.size > MAX_SIZE) {
        errors.push(
          `${file.name}: Image must be smaller than 5MB.`
        );
        return;
      }

      validFiles.push(file);
    });

    if (errors.length) {
      setServerError(errors.join(' '));
    }

    /*
     * Backend supports a maximum of 10 images per upload.
     */
    const totalImages =
      existingImages.length +
      selectedImages.length +
      validFiles.length;

    if (totalImages > 10) {
      setServerError(
        'A listing can have a maximum of 10 images.'
      );

      return;
    }

    if (!validFiles.length) return;

    setSelectedImages((prev) => [
      ...prev,
      ...validFiles
    ]);

    setImagePreviews((prev) => [
      ...prev,
      ...validFiles.map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name
      }))
    ]);

    /*
     * Reset input so the same file can be selected again.
     */
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /*
   * Remove a newly selected image
   */
  const removeSelectedImage = (index) => {
    const preview = imagePreviews[index];

    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }

    setSelectedImages((prev) =>
      prev.filter((_, i) => i !== index)
    );

    setImagePreviews((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  /*
   * Delete an image already stored in the database
   */
  const handleDeleteExistingImage = async (image) => {
    if (!property?.id || !image?.id) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this image?'
    );

    if (!confirmed) return;

    try {
      setUploadingImages(true);
      setServerError('');

      await listingsService.deleteListingImage(
        property.id,
        image.id
      );

      setExistingImages((prev) =>
        prev.filter((item) => item.id !== image.id)
      );

      setSuccessMsg('Image deleted successfully.');
    } catch (err) {
      setServerError(
        err.message || 'Failed to delete image.'
      );
    } finally {
      setUploadingImages(false);
    }
  };

  /*
   * Set an existing image as the cover image
   */
  const handleSetCoverImage = async (image) => {
    if (!property?.id || !image?.id) return;

    try {
      setUploadingImages(true);
      setServerError('');

      await listingsService.setCoverImage(
        property.id,
        image.id
      );

      setExistingImages((prev) =>
        prev.map((item) => ({
          ...item,
          is_cover: item.id === image.id
        }))
      );

      setSuccessMsg('Cover image updated.');
    } catch (err) {
      setServerError(
        err.message || 'Failed to set cover image.'
      );
    } finally {
      setUploadingImages(false);
    }
  };

  const validate = () => {
    const errors = [];

    if (!formData.title.trim()) {
      errors.push('Title is required.');
    }

    if (!formData.price || Number(formData.price) <= 0) {
      errors.push('Price must be a positive number.');
    }

    if (
      formData.bedrooms &&
      Number(formData.bedrooms) < 0
    ) {
      errors.push('Bedrooms cannot be negative.');
    }

    if (
      formData.bathrooms &&
      Number(formData.bathrooms) < 0
    ) {
      errors.push('Bathrooms cannot be negative.');
    }

    if (
      formData.toilets &&
      Number(formData.toilets) < 0
    ) {
      errors.push('Toilets cannot be negative.');
    }

    if (
      formData.parking_spaces &&
      Number(formData.parking_spaces) < 0
    ) {
      errors.push('Parking spaces cannot be negative.');
    }

    if (
      formData.land_size &&
      Number(formData.land_size) < 0
    ) {
      errors.push('Land size cannot be negative.');
    }

    setValidationErrors(errors);

    return errors.length === 0;
  };

  /*
   * Upload images to backend
   */
  const uploadImages = async (listingId) => {
    if (!selectedImages.length) {
      return;
    }

    const formDataImages = new FormData();

    selectedImages.forEach((file) => {
      formDataImages.append('images', file);
    });

    setUploadingImages(true);

    try {
      const result =
        await listingsService.uploadListingImages(
          listingId,
          formDataImages
        );

      /*
       * Add uploaded images to existing images.
       */
      if (result?.images) {
        setExistingImages((prev) => [
          ...prev,
          ...result.images
        ]);
      }

      /*
       * Clear selected files after successful upload.
       */
      imagePreviews.forEach((preview) => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });

      setSelectedImages([]);
      setImagePreviews([]);

      return result;
    } finally {
      setUploadingImages(false);
    }
  };

  /*
   * Submit listing
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerError('');
    setSuccessMsg('');

    if (!validate()) {
      return;
    }

    setLoading(true);

    /*
     * Convert numeric fields.
     */
    const payload = {
      ...formData,
      price: Number(formData.price),
      bedrooms:
        formData.bedrooms === ''
          ? 0
          : Number(formData.bedrooms),
      bathrooms:
        formData.bathrooms === ''
          ? 0
          : Number(formData.bathrooms),
      toilets:
        formData.toilets === ''
          ? 0
          : Number(formData.toilets),
      parking_spaces:
        formData.parking_spaces === ''
          ? 0
          : Number(formData.parking_spaces),
      land_size:
        formData.land_size === ''
          ? 0
          : Number(formData.land_size)
    };

    try {
      let listingId;

      /*
       * EDIT EXISTING LISTING
       */
      if (property && property.id) {
        const result =
          await listingsService.updateListing(
            property.id,
            payload
          );

        listingId =
          result?.listing?.id ||
          result?.id ||
          property.id;

        /*
         * Upload any newly selected images.
         */
        if (selectedImages.length) {
          await uploadImages(listingId);
        }

        setSuccessMsg(
          'Property updated successfully!'
        );
      }

      /*
       * CREATE NEW LISTING
       */
      else {
        const result =
          await listingsService.createListing(payload);

        listingId =
          result?.listing?.id ||
          result?.id;

        if (!listingId) {
          throw new Error(
            'Listing was created, but no listing ID was returned by the server.'
          );
        }

        /*
         * Upload selected images after the listing exists.
         */
        if (selectedImages.length) {
          await uploadImages(listingId);
        }

        setSuccessMsg(
          'Property listed successfully!'
        );
      }

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);

    } catch (err) {
      console.error('Property submission error:', err);

      setServerError(
        err.message ||
        'An error occurred while saving the listing.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isBusy = loading || uploadingImages;

  return (
    <div className="property-form-wrapper">

      <form
        onSubmit={handleSubmit}
        className="property-form"
      >

        {successMsg && (
          <div className="form-alert alert-success">
            {successMsg}
          </div>
        )}

        {serverError && (
          <div className="form-alert alert-error">
            {serverError}
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="form-alert alert-error">
            <ul className="error-list">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ================= IMAGE UPLOAD ================= */}

        <div className="image-upload-section">

          <div className="image-upload-header">
            <div>
              <label className="image-upload-title">
                Property Images
              </label>

              <p className="image-upload-description">
                Upload up to 10 images. JPG, PNG or WEBP.
                Maximum 5MB per image.
              </p>
            </div>

            <span className="image-count">
              {existingImages.length +
                selectedImages.length}
              /10
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleImageSelect}
            hidden
          />

          <button
            type="button"
            className="image-upload-button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={
              isBusy ||
              existingImages.length +
                selectedImages.length >= 10
            }
          >
            + Add Property Photos
          </button>

          {/* Existing images */}

          {existingImages.length > 0 && (
            <div className="image-preview-grid">

              {existingImages.map((image) => (
                <div
                  className={`image-preview-card ${
                    image.is_cover
                      ? 'cover-image'
                      : ''
                  }`}
                  key={image.id}
                >

                  <img
                    src={
                      image.image_url ||
                      image.url
                    }
                    alt="Property"
                  />

                  {image.is_cover && (
                    <span className="cover-badge">
                      Cover Image
                    </span>
                  )}

                  <div className="image-actions">

                    {!image.is_cover && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSetCoverImage(image)
                        }
                        disabled={isBusy}
                      >
                        Set Cover
                      </button>
                    )}

                    <button
                      type="button"
                      className="delete-image-button"
                      onClick={() =>
                        handleDeleteExistingImage(
                          image
                        )
                      }
                      disabled={isBusy}
                    >
                      Delete
                    </button>

                  </div>
                </div>
              ))}

            </div>
          )}

          {/* New image previews */}

          {imagePreviews.length > 0 && (
            <>
              <p className="selected-images-label">
                New images
              </p>

              <div className="image-preview-grid">

                {imagePreviews.map(
                  (preview, index) => (
                    <div
                      className="image-preview-card new-image"
                      key={`${preview.name}-${index}`}
                    >

                      <img
                        src={preview.url}
                        alt={preview.name}
                      />

                      {index === 0 &&
                        existingImages.length === 0 && (
                          <span className="cover-badge">
                            Will be Cover
                          </span>
                        )}

                      <button
                        type="button"
                        className="remove-preview-button"
                        onClick={() =>
                          removeSelectedImage(
                            index
                          )
                        }
                        disabled={isBusy}
                      >
                        ×
                      </button>

                    </div>
                  )
                )}

              </div>
            </>
          )}

        </div>

        {/* ================= PROPERTY FORM ================= */}

        <div className="form-grid">

          <div className="form-group col-span-2">
            <label htmlFor="title">
              Property Title *
            </label>

            <input
              id="title"
              type="text"
              name="title"
              placeholder="e.g. Luxury 4 Bedroom Terrace House"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">
              Price ($) *
            </label>

            <input
              id="price"
              type="number"
              name="price"
              placeholder="e.g. 500000"
              value={formData.price}
              onChange={handleChange}
              required
              min="1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="property_type">
              Property Type *
            </label>

            <select
              id="property_type"
              name="property_type"
              value={formData.property_type}
              onChange={handleChange}
            >
              <option value="apartment">
                Apartment
              </option>
              <option value="house">
                House
              </option>
              <option value="land">
                Land
              </option>
              <option value="commercial">
                Commercial
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="listing_type">
              Listing Type *
            </label>

            <select
              id="listing_type"
              name="listing_type"
              value={formData.listing_type}
              onChange={handleChange}
            >
              <option value="sale">
                For Sale
              </option>
              <option value="rent">
                For Rent
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">
              Listing Status *
            </label>

            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="draft">
                Draft
              </option>
              <option value="pending_review">
                Pending Review
              </option>
              <option value="published">
                Published
              </option>
              <option value="sold">
                Sold
              </option>
              <option value="rented">
                Rented
              </option>
              <option value="archived">
                Archived
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="bedrooms">
              Bedrooms
            </label>

            <input
              id="bedrooms"
              type="number"
              name="bedrooms"
              placeholder="e.g. 3"
              value={formData.bedrooms}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bathrooms">
              Bathrooms
            </label>

            <input
              id="bathrooms"
              type="number"
              name="bathrooms"
              placeholder="e.g. 2"
              value={formData.bathrooms}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="toilets">
              Toilets
            </label>

            <input
              id="toilets"
              type="number"
              name="toilets"
              placeholder="e.g. 3"
              value={formData.toilets}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="parking_spaces">
              Parking Spaces
            </label>

            <input
              id="parking_spaces"
              type="number"
              name="parking_spaces"
              placeholder="e.g. 2"
              value={formData.parking_spaces}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="land_size">
              Land Size (sq ft)
            </label>

            <input
              id="land_size"
              type="number"
              name="land_size"
              placeholder="e.g. 2400"
              value={formData.land_size}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group col-span-2">
            <label htmlFor="address">
              Address
            </label>

            <input
              id="address"
              type="text"
              name="address"
              placeholder="e.g. 15, Banana Island Road"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">
              City
            </label>

            <input
              id="city"
              type="text"
              name="city"
              placeholder="e.g. Ikoyi"
              value={formData.city}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="state">
              State
            </label>

            <input
              id="state"
              type="text"
              name="state"
              placeholder="e.g. Lagos"
              value={formData.state}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="country">
              Country
            </label>

            <input
              id="country"
              type="text"
              name="country"
              placeholder="e.g. Nigeria"
              value={formData.country}
              onChange={handleChange}
            />
          </div>

          <div className="form-group col-span-2">
            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              placeholder="Write a detailed description of the property features, amenities, and details..."
              value={formData.description}
              onChange={handleChange}
              rows="4"
            />
          </div>

        </div>

        {/* ================= ACTIONS ================= */}

        <div className="form-actions">

          <button
            type="button"
            onClick={onCancel}
            className="property-cancel-button"
            disabled={isBusy}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="property-submit-button"
            disabled={isBusy}
          >
            {uploadingImages
              ? 'Uploading Images...'
              : loading
                ? 'Saving Listing...'
                : property
                  ? 'Update Property'
                  : 'List Property'}
          </button>

        </div>

      </form>

    </div>
  );
}