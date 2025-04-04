import React, { useState, useContext } from "react";
import { assets } from "../../assets/assets";
import { AdminContext } from "../../context/AdminContext";
import { toast } from "react-toastify";
import axios from 'axios';

const AddDoctor = () => {
  const [docImg, setDocImg] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [experience, setExperience] = useState("1 Year");
  const [fees, setFees] = useState("");
  const [about, setAbout] = useState("");
  const [speciality, setSpeciality] = useState("Psychologists (Ph.D. or Psy.D.)");
  const [degree, setDegree] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { backendUrl, aToken } = useContext(AdminContext);

  const handleNameChange = (e) => {
    const value = e.target.value;
    // Only allow letters, spaces, hyphens, and apostrophes
    if (/^[a-zA-Z\s'-]*$/.test(value)) {
      setName(value);
      if (errors.name) {
        setErrors({...errors, name: ''});
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const nameRegex = /^[a-zA-Z\s'-]+$/;

    if (!docImg) {
      newErrors.docImg = "Doctor image is required";
    }
    if (!name.trim()) {
      newErrors.name = "Doctor name is required";
    } else if (!nameRegex.test(name.trim())) {
      newErrors.name = "Name should only contain letters, spaces, hyphens, and apostrophes";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!password) {
      newErrors.password = "Password is required";
    }
    if (!fees || isNaN(fees) || fees <= 0) {
      newErrors.fees = "Please enter a valid fee amount";
    }
    if (!degree.trim()) {
      newErrors.degree = "Education is required";
    }
    if (!address1.trim()) {
      newErrors.address1 = "Address line 1 is required";
    }
    if (!about.trim()) {
      newErrors.about = "About section is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("image", docImg);
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("password", password);
      formData.append("experience", experience);
      formData.append("fees", fees);
      formData.append("about", about.trim());
      formData.append("speciality", speciality);
      formData.append("degree", degree.trim());
      formData.append("address", JSON.stringify({ 
        line1: address1.trim(), 
        line2: address2.trim() 
      }));

      const { data } = await axios.post(
        `${backendUrl}/api/admin/add-doctor`, 
        formData, 
        { 
          headers: { 
            aToken,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );

      if (data.success) {
        toast.success(data.message);
        // Reset form
        setDocImg(null);
        setName('');
        setEmail('');
        setPassword('');
        setAddress1('');
        setAddress2('');
        setDegree('');
        setAbout('');
        setFees('');
        setErrors({});
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error adding doctor:", error);
      toast.error(error.response?.data?.message || "Failed to add doctor. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="m-5 w-full">
      <p className="mb-3 text-lg font-medium">Add Doctor</p>
      <div className="bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll">
        <div className="flex items-center gap-4 mb-8 text-gray-500">
          <label htmlFor="doc-img">
            <img
              className="w-16 bg-gray-100 rounded-full cursor-pointer"
              src={docImg ? URL.createObjectURL(docImg) : assets.upload_area}
              alt=""
            />
          </label>
          <input
            onChange={(e) => setDocImg(e.target.files[0])}
            type="file"
            id="doc-img"
            hidden
            accept="image/*"
          />
          <p>
            Upload doctor <br /> picture
          </p>
          {errors.docImg && <p className="text-red-500 text-sm">{errors.docImg}</p>}
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-600">
          <div className="w-full lg:flex flex-col gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <p>Doctor Name</p>
              <input
                onChange={handleNameChange}
                value={name}
                className={`border rounded px-2 py-2 ${errors.name ? 'border-red-500' : ''}`}
                type="text"
                placeholder="Name"
                pattern="[a-zA-Z\s'-]+"
                title="Only letters, spaces, hyphens, and apostrophes are allowed"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p>Doctor Email</p>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className={`border rounded px-2 py-2 ${errors.email ? 'border-red-500' : ''}`}
                type="email"
                placeholder="Email"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p>Doctor Password</p>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className={`border rounded px-2 py-2 ${errors.password ? 'border-red-500' : ''}`}
                type="password"
                placeholder="Password"
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p>Doctor Password</p>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className={`border rounded px-2 py-2 ${errors.password ? 'border-red-500' : ''}`}
                type="password"
                placeholder="Password"
              />
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p>Experience</p>
              <select
                onChange={(e) => setExperience(e.target.value)}
                value={experience}
                className="border rounded px-2 py-2"
              >
                <option value="1 Year">1 Year</option>
                <option value="2 Year">2 Year</option>
                <option value="3 Year">3 Year</option>
                <option value="4 Year">4 Year</option>
                <option value="5 Year">5 Year</option>
                <option value="6 Year">6 Year</option>
                <option value="7 Year">7 Year</option>
                <option value="8 Year">8 Year</option>
                <option value="9 Year">9 Year</option>
                <option value="10 Year">10 Year</option>
              </select>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p>Fees</p>
              <input
                onChange={(e) => setFees(e.target.value)}
                value={fees}
                className={`border rounded px-2 py-2 ${errors.fees ? 'border-red-500' : ''}`}
                type="number"
                placeholder="Fees"
                min="0"
              />
              {errors.fees && <p className="text-red-500 text-sm">{errors.fees}</p>}
            </div>
          </div>

          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <p>Speciality</p>
              <select
                onChange={(e) => setSpeciality(e.target.value)}
                value={speciality}
                className="border rounded px-2 py-2"
              >
                <option value="Psychologists (Ph.D. or Psy.D.)">
                  Psychologists (Ph.D. or Psy.D.)
                </option>
                <option value="Psychiatrists (M.D. or D.O.)">
                  Psychiatrists (M.D. or D.O.)
                </option>
                <option value="Marriage and Family Therapists (MFT)">
                  Marriage and Family Therapists (MFT)
                </option>
                <option value="Child and Adolescent Therapists">
                  Child and Adolescent Therapists
                </option>
                <option value="Neuropsychologists">Neuropsychologists</option>
                <option value="Clinical Social Workers">
                  Clinical Social Workers
                </option>
              </select>
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p>Education</p>
              <input
                onChange={(e) => setDegree(e.target.value)}
                value={degree}
                className={`border rounded px-2 py-2 ${errors.degree ? 'border-red-500' : ''}`}
                type="text"
                placeholder="Education"
              />
              {errors.degree && <p className="text-red-500 text-sm">{errors.degree}</p>}
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <p>Address</p>
              <input
                onChange={(e) => setAddress1(e.target.value)}
                value={address1}
                className={`border rounded px-2 py-2 ${errors.address1 ? 'border-red-500' : ''}`}
                type="text"
                placeholder="address 1"
              />
              {errors.address1 && <p className="text-red-500 text-sm">{errors.address1}</p>}
              <input
                onChange={(e) => setAddress2(e.target.value)}
                value={address2}
                className="border rounded px-2 py-2"
                type="text"
                placeholder="address 2"
              />
            </div>
          </div>
        </div>
        <div>
          <p className="mt-4 mb-2">About Doctor</p>
          <textarea
            onChange={(e) => setAbout(e.target.value)}
            value={about}
            className={`w-full px-4 pt-2 border rounded ${errors.about ? 'border-red-500' : ''}`}
            placeholder="Write about doctor"
            rows={5}
          ></textarea>
          {errors.about && <p className="text-red-500 text-sm">{errors.about}</p>}
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`bg-primary px-10 py-3 mt-4 text-white rounded-full ${isSubmitting ? 'opacity-70' : ''}`}
        >
          {isSubmitting ? 'Adding...' : 'Add Doctor'}
        </button>
      </div>
    </form>
  );
};

export default AddDoctor;