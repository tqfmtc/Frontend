import { useState } from "react";
import axios from "axios";
import { notifyError } from "../admin/toastConfig";
import { getErrorMessage } from "../../utils/errorUtils";



const usePost = () => {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const post = async (url, payload) => {
    setLoading(true);
    try {
      // Get token from localStorage
      let token = localStorage.getItem('token');
      // Fallback to token inside stored user/guest objects
      if (!token) {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          try {
            token = JSON.parse(userDataStr)?.token;
          } catch (err) {
            console.error('Failed to parse userData from localStorage', err);
          }
        }
      }
      if (!token) {
        const guestDataStr = localStorage.getItem('guestData');
        if (guestDataStr) {
          try {
            token = JSON.parse(guestDataStr)?.token;
          } catch (err) {
            console.error('Failed to parse guestData from localStorage', err);
          }
        }
      }
      
      // Create headers with authorization
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const res = await axios.post(url, payload, { headers });
      setResponse(res.data);
      return { data: res.data };
    } catch (err) {
      console.error("POST error:", {
        status: err.response?.status,
        message: err.response?.data?.message,
        payload,
        url
      });
      const message = getErrorMessage(err, 'Request failed');
      notifyError(message);
      return { error: message };
    } finally {
      setLoading(false);
    }
  };
  

  return { post, response, loading };
};

export default usePost;









// import { useState, useEffect } from "react";
// import axios from "axios";
// import { notifyError } from "../admin/toastConfig";



// const usePost = (url, payload) => {
//   const [response, setResponse] = useState([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (!url || !payload) return;
    
//     setLoading(true);
//     axios.post(url, payload)
//       .then((res) => setResponse(res.data))
//       .catch((err) => {
//         console.log(err);
//         notifyError(err.response?.data?.message || "Something went wrong");
//       })
//       .finally(() => setLoading(false));
//   }, [url, payload]);

//   return { response, loading };
// }

// export default usePost;




