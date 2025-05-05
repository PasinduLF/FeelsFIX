import { Link } from "react-router-dom";
import { AiOutlineEdit } from "react-icons/ai";
import { BsInfoCircle } from "react-icons/bs";
import { MdOutlineDelete } from "react-icons/md";
import { FaFileDownload } from "react-icons/fa"; // Kept download icon
import { useState } from "react";
import ContactPDF from "./ContactPDF"; // Updated to use contact PDF component
import { PDFDownloadLink } from "@react-pdf/renderer";
import PropTypes from "prop-types";


const ContactTable = ({ contacts }) => {
  // Changed from reviews to contacts
  const [query, setQuery] = useState("");
  const keys = ["name", "message"]; // Updated search keys for contacts

  ContactTable.propTypes = {
    contacts: PropTypes.array.isRequired, 
  };

  const search = (data) => {
    return data.filter((item) =>
      keys.some((key) => item[key].toLowerCase().includes(query.toLowerCase()))
    );
  };

  return (
    <div className="mt-6">
      {/* Search Input */}
      <div className="form-control mb-6 w-full max-w-lg mx-auto">
        <input
          type="text"
          placeholder="Search by name or message..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input input-bordered w-full bg-white shadow-md focus:ring-2 focus:ring-[#5F6FFF] focus:outline-none py-3 px-4 rounded-full transition-all duration-200"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl shadow-xl bg-white">
        <table className="w-full border-separate border-spacing-0">
          <thead className="bg-[#5F6FFF] text-white">
            <tr>
              <th className="border-b border-[#4b56cc] rounded-tl-xl p-4 text-left text-sm font-semibold">
                No
              </th>
              <th className="border-b border-[#4b56cc] p-4 text-left text-sm font-semibold">
                Name 🖋️
              </th>
              <th className="border-b border-[#4b56cc] p-4 text-left text-sm font-semibold hidden md:table-cell">
                Email 📧
              </th>
              <th className="border-b border-[#4b56cc] p-4 text-left text-sm font-semibold hidden md:table-cell">
                Phone 📞
              </th>
              <th className="border-b border-[#4b56cc] p-4 text-left text-sm font-semibold">
                Message 💬
              </th>
              <th className="border-b border-[#4b56cc] p-4 text-left text-sm font-semibold">
              Category 🏷️
              </th>
              <th className="border-b border-[#4b56cc] p-4 text-left text-sm font-semibold hidden md:table-cell">
                Photo 📸
              </th>
              <th className="border-b border-[#4b56cc] rounded-tr-xl p-4 text-left text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {search(contacts).map((contact, index) => (
              <tr
                key={contact._id}
                className="h-14 even:bg-gray-50 hover:bg-purple-50 transition-colors duration-200"
              >
                <td className="border-b border-gray-200 p-4 text-gray-700">
                  {index + 1}
                </td>
                <td className="border-b border-gray-200 p-4 text-gray-800 font-medium">
                  {contact.name}
                </td>
                <td className="border-b border-gray-200 p-4 text-gray-700 hidden md:table-cell">
                  {contact.email}
                </td>
                <td className="border-b border-gray-200 p-4 text-gray-700 hidden md:table-cell">
                  {contact.phone}
                </td>
                <td className="border-b border-gray-200 p-4 text-gray-700 max-w-xs truncate">
                  {contact.message}
                </td>
                <td className="border-b border-gray-200 p-4 text-gray-700">
                  {contact.category || "No category"}
                </td>
                <td className="border-b border-gray-200 p-4 text-gray-700 hidden md:table-cell">
                  {contact.photo ? (
                    <img
                      src={`../public/images/${contact.photo}`}
                      alt="Contact photo"
                      className="w-16 h-16 object-cover rounded-md shadow-sm"
                    />
                  ) : (
                    "No photo"
                  )}
                </td>
                <td className="border-b border-gray-200 p-4">
                  <div className="flex justify-start items-center gap-x-4">
                    <Link to={`/contact/details/${contact._id}`}>
                      <BsInfoCircle
                        className="text-2xl text-[#5F6FFF] hover:text-[#4b56cc] transition-colors duration-200"
                        title="Details"
                      />
                    </Link>
                    <Link to={`/contact/delete/${contact._id}`}>
                      <MdOutlineDelete
                        className="text-2xl text-red-600 hover:text-red-800 transition-colors duration-200"
                        title="Delete"
                      />
                    </Link>
                    <PDFDownloadLink
                      document={<ContactPDF contact={contact} />}
                      fileName={`Contact_${contact.name}.pdf`}
                    >
                      {({ loading }) =>
                        loading ? (
                          <span className="text-sm text-gray-500">
                            Loading...
                          </span>
                        ) : (
                          <FaFileDownload
                            className="text-2xl text-blue-600 hover:text-blue-800 transition-colors duration-200"
                            title="Download PDF"
                          />
                        )
                      }
                    </PDFDownloadLink>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContactTable;