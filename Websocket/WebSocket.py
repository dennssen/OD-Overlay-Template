import asyncio
import os
import websockets
import json

JSON_FILE = r"B:\Oculus\Software\another-axiom-a2-cqxlff\A2\Content\Scripts\Cameras\Configs\dennssen.overlayInfo.json"
CLIENTS = set()

async def send_data():
    """Continuously checks for JSON updates and broadcasts them to clients."""
    last_modified = os.path.getmtime(JSON_FILE) if os.path.exists(JSON_FILE) else None

    while True:
        await asyncio.sleep(1)  # Wait before checking again

        try:
            if not os.path.exists(JSON_FILE):
                print("JSON file not found!")
                continue

            current_modified = os.path.getmtime(JSON_FILE)
            if current_modified != last_modified:
                last_modified = current_modified

                with open(JSON_FILE, "r") as file:
                    data = json.load(file)

                message = json.dumps(data)

                # Send to all connected clients
                if CLIENTS:
                    print(f"Sending update to {len(CLIENTS)} clients")
                    disconnected_clients = set()

                    for client in CLIENTS:
                        try:
                            await client.send(message)
                        except Exception as e:
                            disconnected_clients.add(client)  # Track disconnected clients

                    CLIENTS.difference_update(disconnected_clients)  # Remove closed connections

        except Exception as e:
            print(f"Error reading JSON file: {e}")

async def handle_connection(websocket, path):
    """Handles new WebSocket connections and sends initial JSON data."""
    CLIENTS.add(websocket)
    try:
        if os.path.exists(JSON_FILE):
            with open(JSON_FILE, "r") as file:
                data = json.load(file)
                await websocket.send(json.dumps(data))  # Send latest JSON immediately

        async for _ in websocket:
            pass  # Keep connection alive
    finally:
        CLIENTS.remove(websocket)

async def main():
    """Starts the WebSocket server and runs the JSON monitoring task."""
    async with websockets.serve(handle_connection, "localhost", 8765):
        print("WebSocket Server running on ws://localhost:8765")
        await send_data()  # Start monitoring JSON updates

if __name__ == "__main__":
    asyncio.run(main())
