import { Contact } from "../models/contactModel.js";

// Controller to save a new contact message
const createContact = async (request, response) => {
  try {
    if (
      !request.body.name ||
      !request.body.email ||
      !request.body.phone ||
      !request.body.message ||
      !request.body.category
    ) {
      return response.status(400).send({
        message: "Send all required fields: name, email, phone, message, category",
      });
    }

    const newContact = {
      name: request.body.name,
      email: request.body.email,
      phone: request.body.phone,
      message: request.body.message,
      category: request.body.category,
      photo: request.file ? request.file.filename : null,
    };

    const contact = await Contact.create(newContact);

    return response.status(201).send(contact);
  } catch (error) {
    console.error("Error in createContact:", error); // Log full error
    response.status(500).send({ message: error.message });
  }
};

// Controller to get all contact messages
const getAllContacts = async (request, response) => {
  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 }); // Sort by newest first

    return response.status(200).json({
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
};

// Controller to get a single contact message by ID
const getContactById = async (request, response) => {
  try {
    const { id } = request.params;

    const contact = await Contact.findById(id);

    if (!contact) {
      return response
        .status(404)
        .json({ message: "Contact message not found" });
    }

    return response.status(200).json(contact);
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
};

// Controller to update a contact message
const updateContact = async (request, response) => {
  try {
    if (
      !request.body.name ||
      !request.body.email ||
      !request.body.phone ||
      !request.body.message ||
      !request.body.category
    ) {
      return response.status(400).send({
        message: "Send all required fields: name, email, phone, message, category",
      });
    }

    const { id } = request.params;
    const { name, email, phone, message, category} = request.body;
    const photo = request.file ? request.file.filename : null;

    const result = await Contact.findByIdAndUpdate(id, {
      name,
      email,
      phone,
      message,
      category,
      ...(photo && { photo }), // Only update photo if a new one is uploaded
    });

    if (!result) {
      return response
        .status(404)
        .json({ message: "Contact message not found" });
    }

    return response
      .status(200)
      .send({ message: " message updated successfully" });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
};

// Controller to delete a contact message
const deleteContact = async (request, response) => {
  try {
    const { id } = request.params;

    const result = await Contact.findByIdAndDelete(id);

    if (!result) {
      return response
        .status(404)
        .json({ message: "Contact message not found" });
    }

    return response
      .status(200)
      .send({ message: "Contact message deleted successfully" });
  } catch (error) {
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
};

// Controller for the test route
const testCreateContact = (req, res) => {
  console.log(req.body);
  res.status(201).json({ message: "Contact message created successfully" });
};

// Export all controller functions
export {
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  testCreateContact,
};
