import React from "react";
import { useState } from "react";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from 'axios';

const AddPayment = () => {
    const [slipImg, setSlipImg] = useState(null);
    const [bank, setBank] = useState("");
    const [branch, setBranch] = useState("");
    const [amount, setAmount] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { backendUrl, token } = useContext(AppContext);

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            if (!slipImg) {
                setIsSubmitting(false);
                return toast.error("Payment slip image is required");
            }
            if (!bank || !branch || !amount) {
                setIsSubmitting(false);
                return toast.error("All fields are required");
            }

            const formData = new FormData();
            formData.append("image", slipImg);
            formData.append("bank", bank);
            formData.append("branch", branch);
            formData.append("amount", amount);

            // Debugging: Log the complete URL and form data
            console.log("Sending to:", `${backendUrl}/api/user/add-payment`);
            formData.forEach((value, key) => {
                console.log(`${key}:`, value);
            });

            const { data } = await axios.post(
                `${backendUrl}/api/user/add-payment`,
                formData,
                {
                    headers: {
                        "token": token,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );
            
            if (data.success) {
                toast.success(data.message);
                setSlipImg(null);
                setBank('');
                setBranch('');
                setAmount('');
            } else {
                toast.error(data.message || "Payment submission failed");
            }
        } catch (error) {
            console.error("Error details:", error);
            
            if (error.response) {
                // The request was made and the server responded with a status code
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
                console.error("Response headers:", error.response.headers);
                
                toast.error(error.response.data.message || 
                    `Request failed with status ${error.response.status}`);
            } else if (error.request) {
                // The request was made but no response was received
                console.error("No response received:", error.request);
                toast.error("No response from server. Please try again.");
            } else {
                // Something happened in setting up the request
                console.error("Request setup error:", error.message);
                toast.error("Error setting up request: " + error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error("File size should be less than 5MB");
                return;
            }
            setSlipImg(file);
        }
    };

    return (
        <form onSubmit={onSubmitHandler} className="m-5 w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Add Payment</h2>
            
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="slipImg">
                    Payment Slip Image *
                </label>
                <input
                    type="file"
                    id="slipImg"
                    onChange={handleImageChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    accept="image/*"
                    required
                />
                {slipImg && (
                    <p className="text-xs text-gray-500 mt-1">Selected: {slipImg.name}</p>
                )}
            </div>
            
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bank">
                    Bank *
                </label>
                <input
                    type="text"
                    id="bank"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Enter bank name"
                    required
                />
            </div>
            
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="branch">
                    Branch *
                </label>
                <input
                    type="text"
                    id="branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Enter branch name"
                    required
                />
            </div>
            
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                    Amount *
                </label>
                <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Enter amount"
                    required
                    min="0"
                    step="0.01"
                />
            </div>
            
            <button
                type="submit"
                className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={isSubmitting}
            >
                {isSubmitting ? "Submitting..." : "Submit Payment"}
            </button>
        </form>
    );
};

export default AddPayment;