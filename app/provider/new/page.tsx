
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  MapPin,
  ImagePlus,
  CheckCircle2,
  Loader2,
  X,
  Upload,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function NewListingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    institution: '',
    address: '',
    price: '',
    nsfas: false,
    room_type: '',
    available_rooms: '',
    amenities: '',
    latitude: '',
    longitude: '',
  });

  const imagePreviews = useMemo(
    () => selectedImages.map((file) => URL.createObjectURL(file)),
    [selectedImages]
  );

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  function updateField(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleImageSelection(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (!files.length) return;

    setError('');

    const validFiles: File[] = [];

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Only JPG, PNG and WEBP images are supported.');
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} is larger than the 5 MB limit.`);
        continue;
      }

      validFiles.push(file);
    }

    setSelectedImages((previous) => {
      const remaining = MAX_IMAGES - previous.length;

      if (validFiles.length > remaining) {
        setError(`You can upload a maximum of ${MAX_IMAGES} images.`);
      }

      return [...previous, ...validFiles.slice(0, remaining)];
    });
  }

  function removeImage(index: number) {
    setSelectedImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    const uploadedPaths: string[] = [];

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Please sign in before submitting a listing.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error('Unable to verify your provider account.');
      }

      if (profile?.role !== 'provider') {
        throw new Error('Only provider accounts can submit listings.');
      }

      if (!selectedImages.length) {
        throw new Error('Please upload at least one accommodation photo.');
      }

      // Upload each selected image to the provider's Storage folder.
      const imageUrls: string[] = [];

      for (const file of selectedImages) {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from('accommodation-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        uploadedPaths.push(filePath);

        const { data: publicUrlData } = supabase.storage
          .from('accommodation-images')
          .getPublicUrl(filePath);

        imageUrls.push(publicUrlData.publicUrl);
      }

      const amenities = form.amenities
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const { error: insertError } = await supabase
        .from('accommodations')
        .insert({
          provider_id: user.id,
          name: form.name.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          institution: form.institution.trim() || null,
          address: form.address.trim() || null,
          price: Number(form.price),
          nsfas: form.nsfas,
          room_type: form.room_type.trim() || null,
          available_rooms: Number(form.available_rooms),
          amenities,
          image_url: imageUrls[0],
          images: imageUrls,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
          status: 'pending',
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSuccess('Your listing and photos have been submitted for review.');

      setTimeout(() => {
        router.push('/provider');
        router.refresh();
      }, 1200);
    } catch (err) {
      // Remove any images uploaded before an error occurred.
      if (uploadedPaths.length) {
        await supabase.storage
          .from('accommodation-images')
          .remove(uploadedPaths);
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="providerFormPage">
      <div className="providerFormContainer">

        <Link href="/provider" className="formBackLink">
          <ArrowLeft size={18} />
          Back to my properties
        </Link>

        <div className="providerFormHeading">
          <span className="formEyebrow">PROVIDER PORTAL</span>
          <h1>Add accommodation</h1>
          <p>
            Share your accommodation with students looking for a place
            to stay in Mpumalanga.
          </p>
        </div>

        {error && (
          <div className="formAlert formAlertError">{error}</div>
        )}

        {success && (
          <div className="formAlert formAlertSuccess">
            <CheckCircle2 size={19} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="providerListingForm">

          <section className="listingFormSection">
            <div className="listingSectionHeading">
              <div className="listingSectionIcon">
                <Building2 size={20} />
              </div>
              <div>
                <h2>Basic information</h2>
                <p>Tell students about your accommodation.</p>
              </div>
            </div>

            <div className="listingFormGrid">
              <label className="listingField fullWidth">
                Accommodation name *
                <input
                  type="text"
                  placeholder="e.g. Sondela Student Residence"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                />
              </label>

              <label className="listingField fullWidth">
                Description *
                <textarea
                  placeholder="Describe your accommodation and what makes it suitable for students..."
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={5}
                  required
                />
              </label>

              <label className="listingField">
                Location / Town *
                <input
                  type="text"
                  placeholder="e.g. Mbombela"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  required
                />
              </label>

              <label className="listingField">
                Nearby institution
                <input
                  type="text"
                  placeholder="e.g. University of Mpumalanga"
                  value={form.institution}
                  onChange={(e) => updateField('institution', e.target.value)}
                />
              </label>

              <label className="listingField fullWidth">
                Physical address
                <input
                  type="text"
                  placeholder="Street address and suburb"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="listingFormSection">
            <div className="listingSectionHeading">
              <div className="listingSectionIcon">
                <MapPin size={20} />
              </div>
              <div>
                <h2>Rooms and pricing</h2>
                <p>Provide current room and rental information.</p>
              </div>
            </div>

            <div className="listingFormGrid">
              <label className="listingField">
                Monthly price (R) *
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 3500"
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  required
                />
              </label>

              <label className="listingField">
                Available rooms *
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 12"
                  value={form.available_rooms}
                  onChange={(e) => updateField('available_rooms', e.target.value)}
                  required
                />
              </label>

              <label className="listingField fullWidth">
                Room type
                <select
                  value={form.room_type}
                  onChange={(e) => updateField('room_type', e.target.value)}
                >
                  <option value="">Select room type</option>
                  <option value="Single room">Single room</option>
                  <option value="Shared room">Shared room</option>
                  <option value="En-suite room">En-suite room</option>
                  <option value="Bachelor unit">Bachelor unit</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="listingCheckbox fullWidth">
                <input
                  type="checkbox"
                  checked={form.nsfas}
                  onChange={(e) => updateField('nsfas', e.target.checked)}
                />
                <span>
                  <strong>NSFAS accommodation</strong>
                  <small>This accommodation accepts NSFAS-funded students.</small>
                </span>
              </label>
            </div>
          </section>

          <section className="listingFormSection">
            <div className="listingSectionHeading">
              <div className="listingSectionIcon">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h2>Facilities and amenities</h2>
                <p>List the facilities available to students.</p>
              </div>
            </div>

            <label className="listingField fullWidth">
              Amenities
              <textarea
                placeholder="Wi-Fi, Security, Laundry, Parking, Study area, Meals"
                value={form.amenities}
                onChange={(e) => updateField('amenities', e.target.value)}
                rows={3}
              />
              <small className="fieldHint">
                Separate each facility with a comma.
              </small>
            </label>
          </section>

          <section className="listingFormSection">
            <div className="listingSectionHeading">
              <div className="listingSectionIcon">
                <ImagePlus size={20} />
              </div>
              <div>
                <h2>Accommodation photos</h2>
                <p>Upload up to {MAX_IMAGES} photos of your property.</p>
              </div>
            </div>

            <label className="imageUploadArea">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageSelection}
                disabled={selectedImages.length >= MAX_IMAGES || loading}
              />

              <div className="imageUploadIcon">
                <Upload size={25} />
              </div>

              <strong>Click to upload photos</strong>
              <span>JPG, PNG or WEBP · Maximum 5 MB per image</span>
              <small>
                {selectedImages.length} of {MAX_IMAGES} photos selected
              </small>
            </label>

            {imagePreviews.length > 0 && (
              <div className="selectedImagesGrid">
                {imagePreviews.map((preview, index) => (
                  <div className="selectedImage" key={preview}>
                    <img src={preview} alt={`Selected photo ${index + 1}`} />

                    {index === 0 && (
                      <span className="mainImageLabel">Main photo</span>
                    )}

                    <button
                      type="button"
                      className="removeSelectedImage"
                      onClick={() => removeImage(index)}
                      aria-label={`Remove image ${index + 1}`}
                      disabled={loading}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <small className="fieldHint">
              The first photo will be used as the main listing image.
              You can change the order by removing and selecting photos again.
            </small>
          </section>

          <section className="listingFormSection">
            <div className="listingSectionHeading">
              <div className="listingSectionIcon">
                <MapPin size={20} />
              </div>
              <div>
                <h2>Map location</h2>
                <p>Optional coordinates for displaying your property on a map.</p>
              </div>
            </div>

            <div className="listingFormGrid">
              <label className="listingField">
                Latitude
                <input
                  type="number"
                  step="any"
                  placeholder="-25.4658"
                  value={form.latitude}
                  onChange={(e) => updateField('latitude', e.target.value)}
                />
              </label>

              <label className="listingField">
                Longitude
                <input
                  type="number"
                  step="any"
                  placeholder="30.9853"
                  value={form.longitude}
                  onChange={(e) => updateField('longitude', e.target.value)}
                />
              </label>
            </div>
          </section>

          <div className="listingFormFooter">
            <p>
              Your listing will be reviewed before it becomes visible
              to students.
            </p>

            <button
              type="submit"
              className="listingSubmitButton"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spinIcon" />
                  Uploading and submitting...
                </>
              ) : (
                <>
                  Submit listing
                  <CheckCircle2 size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
