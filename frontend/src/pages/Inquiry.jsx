/* eslint-disable react/no-unescaped-entities */
import { useEffect, useState } from "react";
import axios from "axios";
import Spinner from "../components/Spinner";
import { Link } from "react-router-dom";
import { MdOutlineAddBox } from "react-icons/md";
import { AiOutlineEdit } from "react-icons/ai";
import { BsInfoCircle } from "react-icons/bs";
import { MdOutlineDelete } from "react-icons/md";
import { FaHeart, FaWhatsapp, FaInstagram, FaFacebookF } from "react-icons/fa";

const Inquiry = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const keys = ["name", "message"];

  const search = (data) => {
    return data.filter((item) =>
      keys.some((key) => item[key].toLowerCase().includes(query.toLowerCase()))
    );
  };

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:4000/contact")
      .then((response) => {
        setContacts(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white flex flex-col">
      

      {/* Hero Section */}
      <div
        className="hero min-h-[70vh] bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?q=80&w=2070&auto=format&fit=crop)",
        }}
      >
        <div className="hero-overlay bg-opacity-50 bg-black"></div>
        <div className="hero-content text-center text-white">
          <div className="max-w-2xl">
            <h1 className="mb-6 text-5xl md:text-6xl font-extrabold leading-tight drop-shadow-lg">
              Connect with Care 
            </h1>
            <p className="mb-8 text-lg md:text-xl text-purple-100 drop-shadow-md">
              Reach out to us for support, inquiries, or to book a therapy
              session. We're here to help you heal and grow! 
            </p>
            <Link to="/contact/create">
            <button className="bg-[#5F6FFF] hover:bg-[#4b56cc] text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg  justify-center transition-transform duration-300 ">
  Get in Touch 📩
</button>

            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: "Book a Session",
            desc: "Schedule a therapy session with our experts.",
            img: "https://static.wixstatic.com/media/dd7bda_a1efa011ef7042a0867355a46d46e5bf~mv2.jpg/v1/fill/w_568,h_378,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/dd7bda_a1efa011ef7042a0867355a46d46e5bf~mv2.jpg",
          },
          {
            title: "Share Your Needs",
            desc: "Let us know how we can support you.",
            img: "https://images.unsplash.com/photo-1593642532973-d31b6557fa68?q=80&w=2070&auto=format&fit=crop",
          },
          {
            title: "Upload a Photo",
            desc: "Add a personal touch to your message.",
            img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop",
          },
        ].map((card, index) => (
          <div
            key={index}
            className="card bg-white shadow-xl rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <figure>
              <img
                src={card.img}
                alt={card.title}
                className="w-full h-56 object-cover"
              />
            </figure>
            <div className="card-body p-6">
              <h2 className="card-title text-2xl font-semibold text-[#5F6FFF]">
                {card.title}
              </h2>
              <p className="text-gray-600">{card.desc}</p>
              <div className="card-actions justify-end mt-4">
              
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contact Messages Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 flex-grow">
        <div className="form-control mb-8 max-w-lg mx-auto">
          <input
            type="text"
            placeholder="Search messages by name or text..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input input-bordered w-full bg-white shadow-md focus:ring-2 focus:ring-[#5F6FFF] focus:outline-none py-3 px-4 rounded-full transition-all duration-200"
          />
        </div>
        {loading ? (
          <Spinner />
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-lg">
            <table className="w-full">
              <thead className="bg-[#5F6FFF] text-white">
                <tr>
                  <th className="p-4 text-left rounded-tl-xl">No</th>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left hidden md:table-cell">Email</th>
                  <th className="p-4 text-left hidden md:table-cell">Phone</th>
                  <th className="p-4 text-left hidden md:table-cell">Category</th>
                  <th className="p-4 text-left">Message</th>
                  <th className="p-4 text-left hidden md:table-cell">Photo</th>
                  <th className="p-4 text-left rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {search(contacts).map((contact, index) => (
                  <tr
                    key={contact._id}
                    className="even:bg-gray-50 hover:bg-purple-50 transition-colors duration-200"
                  >
                    <td className="p-4 text-gray-700">{index + 1}</td>
                    <td className="p-4 text-gray-800 font-medium">
                      {contact.name}
                    </td>
                    <td className="p-4 text-gray-700 hidden md:table-cell">
                      {contact.email}
                    </td>
                    <td className="p-4 text-gray-700 hidden md:table-cell">
                      {contact.phone}
                    </td>
                    <td className="p-4 text-gray-700 hidden md:table-cell">
                      {contact.category}
                    </td>
                    <td className="p-4 text-gray-700 max-w-xs truncate">
                      {contact.message}
                    </td>
                    <td className="p-4 text-gray-700 hidden md:table-cell">
                      {contact.photo ? (
                        <img
                          src={`../public/images/${contact.photo}`}
                          alt={`${contact.name}'s message`}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      ) : (
                        "No photo"
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-x-4">
                        <Link to={`/contact/details/${contact._id}`}>
                          <BsInfoCircle className="text-2xl text-[#5F6FFF] hover:text-[#4b56cc]" />
                        </Link>
                        <Link to={`/contact/edit/${contact._id}`}>
                          <AiOutlineEdit className="text-2xl text-yellow-600 hover:text-yellow-800" />
                        </Link>
                        <Link to={`/contact/delete/${contact._id}`}>
                          <MdOutlineDelete className="text-2xl text-red-600 hover:text-red-800" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inquiry;
