import { useEffect , useState } from "react";
import axios from "axios";


function App() {
  const [msg , setMsg] = useState<string>("")
  useEffect(() => {
    const fetchMsg = async() => {
      const res = await axios.get("http://127.0.0.1:8000/health")
      console.log(res);
      setMsg(res.data.message);
    }
    fetchMsg();
  } , [])

  return (
    <>
      <div className="flex items-center justify-center m-5">
        <h1 className="bg-blue-500 text-6xl">The Message is : {msg} </h1>
      </div>
    </>
  );
}

export default App;
