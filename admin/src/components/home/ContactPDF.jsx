import React from "react";
import PropTypes from "prop-types";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Define styles for a professional and beautiful layout
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#f5f3ff", // Light purple background for therapy theme
    padding: 40,
  },
  header: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "extrabold",
    marginBottom: 25,
    color: "#5F6FFF", // Therapy theme color
    borderBottom: "2px solid #5F6FFF", // Purple underline
    paddingBottom: 5,
  },
  section: {
    marginBottom: 15,
    padding: 20,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderLeft: "4px solid #5F6FFF", // Purple accent on left
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2d3748", // Dark gray-blue for labels
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    color: "#4a5568", // Softer gray for text
    marginBottom: 8,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 11,
    color: "#718096", // Muted gray for footer
    fontStyle: "italic",
  },
});

const ContactPDF = ({ contact }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <Text style={styles.header}>FeelsFIX Contact Details 📩</Text>

      {/* Contact Information */}
      <View style={styles.section}>
        <Text style={styles.label}>Name 🖋️:</Text>
        <Text style={styles.text}>{contact.name}</Text>

        <Text style={styles.label}>Email 📧:</Text>
        <Text style={styles.text}>{contact.email}</Text>

        <Text style={styles.label}>Phone 📞:</Text>
        <Text style={styles.text}>{contact.phone}</Text>

        <Text style={styles.label}>Message 💬:</Text>
        <Text style={styles.text}>{contact.message}</Text>

        

        <Text style={styles.label}>Submitted ⏰:</Text>
        <Text style={styles.text}>
          {new Date(contact.createdAt).toLocaleString()}
        </Text>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Thank you for reaching out to FeelsFIX! 💜
      </Text>
    </Page>
  </Document>
);

ContactPDF.propTypes = {
  contact: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    photo: PropTypes.string,
    createdAt: PropTypes.string.isRequired, // Assuming createdAt is provided
  }).isRequired,
};

export default ContactPDF;
