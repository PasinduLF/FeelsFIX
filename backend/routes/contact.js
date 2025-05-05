import express from "express";
import {
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  testCreateContact,
} from "../controllers/contactController.js";
import { upload } from "../middlewares/requirePhoto.js";

const router = express.Router();

//route to save a contact message
router.post("/", upload.single("photo"), createContact);

//route to get a contact messages
router.get("/", getAllContacts);

//route to get a contact message by id
router.get("/:id", getContactById);

//route to update a contact message
router.put("/:id", upload.single("photo"), updateContact);

//route to delete a contact message
router.delete("/:id", deleteContact);

//test route for contact message
router.post("/create", testCreateContact);

export default router;
