import React, { useEffect, useState } from "react";

const AttendanceController = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [days, setDays] = useState("");

    // Get token from localStorage or wherever you store it
    const getToken = () => {
        return localStorage.getItem('token'); // Adjust this based on where you store your token
    };

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const token = getToken();
                const response = await fetch(`${import.meta.env.VITE_API_URL}/attendance/buttonStatus", {
                    method: "GET",
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setStatus(data.status);
            } catch (err) {
                alert("Failed to fetch status");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const handleToggle = async () => {
        setToggleLoading(true);
        try {
            const token = getToken();
            const payload = { status: !status };
            if (status === true && days) {
                payload.days = Number(days);
            }

            const response = await fetch("/attendance/buttonToggle", {
                method: "POST",
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setStatus(!status);
            setDays("");
        } catch (err) {
            alert("Failed to toggle attendance button");
            console.error(err);
        } finally {
            setToggleLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: 400, margin: "40px auto", padding: 24, border: "1px solid #eee", borderRadius: 8 }}>
            <h2>Attendance Button Control</h2>
            <p>
                Current Status:{" "}
                <span style={{ color: status ? "green" : "red", fontWeight: "bold" }}>
                    {status ? "Enabled" : "Disabled"}
                </span>
            </p>
            {status ? (
                <div>
                    <label>
                        Number of days to keep disabled:{" "}
                        <input
                            type="number"
                            min="1"
                            value={days}
                            onChange={e => setDays(e.target.value)}
                            style={{ width: 60 }}
                            disabled={toggleLoading}
                        />
                    </label>
                </div>
            ) : null}
            <button
                onClick={handleToggle}
                disabled={toggleLoading || (status && !days)}
                style={{
                    marginTop: 16,
                    padding: "8px 16px",
                    background: status ? "#e74c3c" : "#2ecc71",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer"
                }}
            >
                {toggleLoading
                    ? "Processing..."
                    : status
                    ? "Disable Attendance Button"
                    : "Enable Attendance Button"}
            </button>
        </div>
    );
};

export default AttendanceController;
