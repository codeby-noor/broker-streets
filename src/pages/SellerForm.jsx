import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import LargeButton from '../components/LargeButton';
import { toast } from 'react-toastify';
import {
  gujaratStateOptions,
  gujaratDistricts,
  gujaratSubDistricts,
} from '../utils/data';

const propertyOptions = [
  'Residential Plots',
  'Industrial Plots',
  'Bungalows',
  'Commercial Space (Office, Shop)',
  'Villas',
  'Farmhouse',
];

const pricingTypes = [
  'Total Property Price',
  'Per Sq. Ft.',
  'Per Sq. Yard',
  'Per Sq. Meter',
  'Per Acre',
  'Per Hectare',
  'Per Guntha',
  'Per Bigha',
];

const areaUnits = [
  'Sq. Ft.',
  'Sq. Yard',
  'Sq. Meter',
  'Acre',
  'Hectare',
  'Guntha',
  'Bigha',
];

function SellerForm() {
  const navigate = useNavigate();

  const {
  register,
  handleSubmit,
  watch,
  formState: { errors },
} = useForm({
  defaultValues: {
    state: "Gujarat",
  },
});
const selectedDistrict = watch("district");
  const [submitting, setSubmitting] = useState(false);


  const onSubmit = (data) => {
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);

      toast.success('Your property has been submitted successfully.');

      try {
        const existing = JSON.parse(localStorage.getItem('broker-streets-seller-leads') || '[]');
     const lead = {
  ...data,
  price: data.price,
  priceType: data.priceType,
  propertyImages: images,
  propertyDocument: document,
  submittedAt: new Date().toISOString(),
};
        localStorage.setItem('broker-streets-seller-leads', JSON.stringify([...existing, lead]));
        localStorage.setItem('sellerFormSubmitted', 'true');
        localStorage.setItem('broker-streets-seller-lead', JSON.stringify(lead));
      } catch (e) {
        // ignore quota errors
      }

      navigate('/add-property', {
        state: {
          justSubmitted: true,
          data,
        },
      });
    }, 700);
  };



  return (

    <div className="-mx-4 -mt-8 bg-[#FFFEFE] pb-20 sm:-mx-6 lg:-mx-8">


      {/* Hero */}

      <section className="bg-ink px-6 py-20 text-white sm:px-10 lg:px-12">

        <div className="mx-auto max-w-6xl">

          <p className="eyebrow text-blue-200">
            Sell With Broker Streets
          </p>


          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">

            Turn your property into the right opportunity.

          </h1>


          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">

            Share your property details and connect with genuine
            buyers through our local real estate network.

          </p>



          <div className="mt-10 grid gap-4 sm:grid-cols-3">


            <div className="rounded-2xl bg-white/10 p-5">

              <p className="text-2xl font-bold">
                1200+
              </p>

              <p className="text-sm text-white/70">
                Buyer enquiries
              </p>

            </div>



            <div className="rounded-2xl bg-white/10 p-5">

              <p className="text-2xl font-bold">
                14 Days
              </p>

              <p className="text-sm text-white/70">
                Average response
              </p>

            </div>




            <div className="rounded-2xl bg-white/10 p-5">

              <p className="text-2xl font-bold">
                4.8/5
              </p>

              <p className="text-sm text-white/70">
                Seller rating
              </p>

            </div>


          </div>


        </div>


      </section>





      {/* Form Container */}

      <section className="mx-auto -mt-10 max-w-5xl px-6 lg:px-12">


        <div className="rounded-[32px] bg-white p-6 shadow-xl sm:p-10">



          <div className="border-b border-slate-200 pb-6">

            <p className="eyebrow">
              Property Details
            </p>


            <h2 className="mt-3 text-3xl font-bold text-ink">

              Tell us about your property

            </h2>


            <p className="mt-3 text-muted">

              Fields marked with * are required.

            </p>


          </div>





          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-10"
          >





            {/* Owner Section */}


            <div>
              <h3 className="text-xl font-bold text-ink">Owner Details</h3>
              <div className="mt-5 space-y-5">
                <div>
                  <label className="label-style">Full Name *</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    className="input-style"
                    placeholder="Enter your name"
                  />
                  {errors.name && <p className="error-style">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="label-style">Mobile Number *</label>
                  <input
                    {...register('mobile', {
                      required: 'Mobile is required',
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Enter valid 10 digit number',
                      },
                    })}
                    className="input-style"
                    placeholder="9876543210"
                  />
                  {errors.mobile && <p className="error-style">{errors.mobile.message}</p>}
                </div>

                <div>
                  <label className="label-style">WhatsApp Number</label>
                  <input {...register('whatsapp')} className="input-style" placeholder="Optional" />
                </div>

                <div>
                  <label className="label-style">Email (optional)</label>
                  <input
                    {...register('email', {
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address',
                      },
                    })}
                    className="input-style"
                    placeholder="name@example.com"
                  />
                  {errors.email && <p className="error-style">{errors.email.message}</p>}
                </div>
              </div>
            </div>






            {/* Property Section */}

            <div>
              <h3 className="text-xl font-bold text-ink">Property Details</h3>
              <div className="mt-5 space-y-5">
                <div>
                  <label className="label-style">State *</label>
                  <select {...register('state', { required: 'State is required' })} className="input-style">
                    {gujaratStateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.state && <p className="error-style">{errors.state.message}</p>}
                </div>

                <div>
  <label className="label-style">District *</label>

  <select
    {...register("district", {
      required: "District is required",
    })}
    className="input-style"
  >
    <option value="">Select District</option>

    {gujaratDistricts.map((district) => (
      <option key={district} value={district}>
        {district}
      </option>
    ))}
  </select>

  {errors.district && (
    <p className="error-style">
      {errors.district.message}
    </p>
  )}
</div>
<div>
  <label className="label-style">
    Sub District / Taluka *
  </label>

  <select
    {...register("subDistrict", {
      required: "Sub District is required",
    })}
    className="input-style"
  >
    <option value="">Select Sub District</option>

    {gujaratSubDistricts[selectedDistrict]?.map((taluka) => (
      <option key={taluka} value={taluka}>
        {taluka}
      </option>
    ))}
  </select>

  {errors.subDistrict && (
    <p className="error-style">
      {errors.subDistrict.message}
    </p>
  )}
</div>
                <div>
                  <label className="label-style">Property Type *</label>
                  <select {...register('type', { required: 'Select property type' })} className="input-style">
                    <option value="">Select Property Type</option>
                    {propertyOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  {errors.type && <p className="error-style">{errors.type.message}</p>}
                </div>

                <div>
  <label className="label-style">Price *</label>

  <input
    type="number"
    {...register("price", {
      required: "Price is required",
    })}
    className="input-style"
    placeholder="e.g. 2300000"
  />

  {errors.price && (
    <p className="error-style">{errors.price.message}</p>
  )}
</div>

<div>
  <label className="label-style">Price Type *</label>

  <select
    {...register("priceType", {
      required: "Select price type",
    })}
    className="input-style"
  >
    <option value="">Select Price Type</option>
    <option>Total Property Price</option>
    <option>Per Sq. Ft.</option>
    <option>Per Sq. Yard</option>
    <option>Per Sq. Meter</option>
    <option>Per Acre</option>
    <option>Per Hectare</option>
    <option>Per Guntha</option>
    <option>Per Bigha</option>
  </select>

  {errors.priceType && (
    <p className="error-style">{errors.priceType.message}</p>
  )}
</div>

               

                <div>
                  <label className="label-style">Google Maps Link *</label>
                  <input
                    {...register('mapLink', {
                      required: 'Google Maps link is required',
                      pattern: {
                        value: /^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.com).+/i,
                        message: 'Please enter a valid Google Maps link',
                      },
                    })}
                    className="input-style"
                    placeholder="https://maps.google.com/..."
                  />
                  {errors.mapLink && <p className="error-style">{errors.mapLink.message}</p>}
                  <p className="mt-2 text-sm text-slate-500">Paste the Google Maps location link of your property.</p>
                </div>

                <div>
                  <label className="label-style">Additional Property Details (optional)</label>
                  <textarea {...register('additionalDetails')} className="input-style min-h-[100px]" placeholder="Parking, size, furnishing, facing, etc." />
                </div>
                <div>
  <label className="label-style">
    Property Images *
  </label>

  <input
    type="file"
    multiple
    accept="image/*"
    {...register("propertyImages", {
      required: "Please upload at least one property image",
      validate: (files) =>
        files?.length > 0 || "Please upload at least one image",
    })}
    className="input-style"
  />

  <p className="mt-2 text-sm text-slate-500">
    Upload multiple images (JPG, PNG, WEBP).
  </p>

  {errors.propertyImages && (
    <p className="error-style">
      {errors.propertyImages.message}
    </p>
  )}
</div><div>
  <label className="label-style">
    Property Documents (PDF) *
  </label>

  <input
    type="file"
    accept=".pdf"
    {...register("propertyDocument", {
      required: "Property document is required",
      validate: (files) => {
        if (!files?.length) return "Property document is required";

        const file = files[0];

        if (file.type !== "application/pdf") {
          return "Only PDF files are allowed";
        }

        if (file.size > 10 * 1024 * 1024) {
          return "Maximum file size is 10 MB";
        }

        return true;
      },
    })}
    className="input-style"
  />

  <p className="mt-2 text-sm text-slate-500">
    Upload Sale Deed, 7/12 Extract, Property Card, NA Order or other ownership proof.
  </p>

  {errors.propertyDocument && (
    <p className="error-style">
      {errors.propertyDocument.message}
    </p>
  )}
</div>
              </div>
            </div>








            {/* Buttons */}



            <div className="flex flex-wrap gap-4">


              <LargeButton type="submit" disabled={submitting}>

                {
                  submitting
                  ?
                  'Submitting...'
                  :
                  'Submit Property'
                }

              </LargeButton>




              <button

                type="button"

                onClick={
                  ()=>navigate('/home')
                }

                className="rounded-3xl border border-slate-200 px-8 py-4 font-semibold"

              >

                Cancel

              </button>


            </div>



          </form>



        </div>



      </section>



    </div>

  );

}


export default SellerForm;