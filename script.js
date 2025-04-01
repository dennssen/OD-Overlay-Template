const socket = new WebSocket("ws://localhost:8765")

socket.onopen = () => {
    console.log("Connected to socket")
};

socket.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        console.log("Received Data: ", data);
    } catch (error) {
        console.log("Error Parsing JSON: ", error);
    }
};

socket.onerror = (error) => {
    console.error("WebSocket Error:", error);
};

socket.onclose = () => {
    console.log("WebSocket connection closed");
};