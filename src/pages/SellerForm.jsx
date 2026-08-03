import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import LargeButton from '../components/LargeButton';
import { toast } from 'react-toastify';

const propertyOptions = [
  'Residential Plots',
  'Industrial Plots',
  'Bungalows',
  'Commercial Space (Office, Shop)',
  'Villas',
  'Farmhouse',
];

const locationOptions = [
  'Surat',
  'Navsari',
  'Other',
];

function SellerForm() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const [submitting, setSubmitting] = useState(false);

  const location = watch('location');


  const onSubmit = (data) => {

    setSubmitting(true);

    setTimeout(() => {

      setSubmitting(false);

      toast.success(
        'Your property has been submitted successfully.'
      );

      try {
        const existing = JSON.parse(localStorage.getItem('broker-streets-seller-leads') || '[]');
        const lead = { ...data, submittedAt: new Date().toISOString() };
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


    },700);

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


              <h3 className="text-xl font-bold text-ink">

                Owner Information

              </h3>



              <div className="mt-5 grid gap-5 md:grid-cols-2">



                <div>

                  <label className="label-style">
                    Full Name *
                  </label>


                  <input

                    {...register(
                      'name',
                      {
                        required:
                        'Name is required'
                      }
                    )}

                    className="input-style"

                    placeholder="Enter your name"

                  />


                  {errors.name &&
                  <p className="error-style">
                    {errors.name.message}
                  </p>}


                </div>





                <div>

                  <label className="label-style">
                    Mobile Number *
                  </label>


                  <input

                    {...register(
                      'mobile',
                      {
                        required:
                        'Mobile is required',

                        pattern:{
                          value:/^[0-9]{10}$/,
                          message:
                          'Enter valid 10 digit number'
                        }
                      }
                    )}

                    className="input-style"

                    placeholder="9876543210"

                  />


                  {errors.mobile &&
                  <p className="error-style">
                    {errors.mobile.message}
                  </p>}


                </div>

                <div>
                  <label className="label-style">
                    Email (optional)
                  </label>
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


              <h3 className="text-xl font-bold text-ink">

                Property Information

              </h3>



              <div className="mt-5 grid gap-5 md:grid-cols-2">



                <input

                  {...register(
                    'city',
                    {
                      required:
                      'City is required'
                    }
                  )}

                  className="input-style"

                  placeholder="City"

                />





                <select

                  {...register(
                    'type',
                    {
                      required:
                      'Select property type'
                    }
                  )}

                  className="input-style"

                >

                  <option value="">
                    Select Property Type
                  </option>


                  {
                    propertyOptions.map(
                      item =>
                      <option key={item}>
                        {item}
                      </option>
                    )
                  }


                </select>






                <input

                  {...register('price')}

                  className="input-style"

                  placeholder="Expected Price"

                />






                <div>
  <label className="label-style">
    Google Maps Link *
  </label>

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

  {errors.mapLink && (
    <p className="error-style">
      {errors.mapLink.message}
    </p>
  )}

  <p className="mt-2 text-sm text-slate-500">
    Paste the Google Maps location link of your property.
  </p>
</div>

              </div>


            </div>








            {/* Location Section */}



            <div>


              <h3 className="text-xl font-bold text-ink">

                Property Location

              </h3>



              <div className="mt-5 flex flex-wrap gap-4">


              {
                locationOptions.map(
                  loc => (

                  <label

                    key={loc}

                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-5 py-4"

                  >

                    <input

                      type="radio"

                      value={loc}

                      {...register(
                        'location',
                        {
                          required:
                          'Select location'
                        }
                      )}

                    />


                    {loc}


                  </label>

                  )
                )
              }


              </div>



              {
                location === 'Other' &&

                <input

                  {...register(
                    'locationOther',
                    {
                      required:
                      'Specify location'
                    }
                  )}

                  className="input-style mt-5"

                  placeholder="Enter location"

                />

              }


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