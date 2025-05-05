import { Link } from "react-router-dom";
import { FaHeart } from "react-icons/fa"; // Changed to a heart icon for therapy theme
import { BiUserCircle } from "react-icons/bi";
import { AiOutlineEdit } from "react-icons/ai";
import { BsInfoCircle } from "react-icons/bs";
import { MdOutlineDelete } from "react-icons/md";
import ContactSingleCard from "./ContactSingleCard"; // Updated component name

const ContactCard = ({ contacts }) => {
  // Changed from reviews to contacts
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {contacts.map((item) => (
        <ContactSingleCard key={item._id} contact={item} /> // Changed prop from review to contact
      ))}
    </div>
  );
};

export default ContactCard;
