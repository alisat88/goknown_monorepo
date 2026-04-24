import { ca } from "date-fns/locale";
import React, { useState, useEffect, useCallback } from "react";
import { v4 as uuid } from "uuid";

import Button from "../../components/Button";
import ButtonBack from "../../components/ButtonBack";
import api from "../../services/api";
import { IUser } from "../InviteUser";
import { Container, Content } from "./styles";

const Laboratory: React.FC<React.PropsWithChildren<unknown>> = () => {
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState("/users");
  const [processMode, setPorcessMode] = useState("frontend");
  const [quantity, setQuantity] = useState(1000); // Default to 1000 sends
  const [results, setResults] = useState<
    { success: boolean | null; message: string }[]
  >([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>("00:00:00.000");

  const handleRouteChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setRoute(event.target.value);
    },
    []
  );

  const handleQuantityChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuantity(parseInt(event.target.value, 10));
    },
    []
  );

  // Timer Effect: Updates elapsedTime every 50ms while loading is true
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const milliseconds = Math.floor(diff % 1000);
        const formattedTime = `${String(hours).padStart(2, "0")}:${String(
          minutes
        ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(
          milliseconds
        ).padStart(3, "0")}`;
        setElapsedTime(formattedTime);
      }, 50); // Update every 50ms for better precision
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [loading, startTime]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setStartTime(new Date());
    setElapsedTime("00:00:00.000");

    // Initialize results with "Sending..." messages
    setResults(
      Array.from({ length: quantity }, (_, index) => ({
        success: null,
        message: `Send ${index + 1}: Sending...`,
      }))
    );

    const CHUNK_SIZE = 50; // Chunk size
    const MAX_CONCURRENT_CHUNKS = 10; // Maximum number of chunks to send concurrently
    const totalChunks = Math.ceil(quantity / CHUNK_SIZE); // Total number of chunks

    // Prepare a function to send a chunk of requests
    const sendChunk = async (chunkIndex: number) => {
      const chunkSize = Math.min(
        CHUNK_SIZE,
        quantity - chunkIndex * CHUNK_SIZE
      );
      const chunkPromises = [];

      let users: IUser[] = [];
      if (route === "/transactions") {
        const response = await api.get<IUser[]>("/users", {
          params: { limit: 100, offset: 0 },
        });
        users = response.data;
      }

      // eslint-disable-next-line no-plusplus
      for (let k = 0; k < chunkSize; k++) {
        const index = chunkIndex * CHUNK_SIZE + k;
        let body;

        if (route === "/users") {
          body = {
            name: `User${index}`,
            email: `user${uuid()}@example.com`,
            password: `password${index}`,
            ignoreWelcomeEmail: true,
          };
        } else if (route === "/transactions") {
          const randomUser = users[Math.floor(Math.random() * users.length)];
          body = {
            amount: 1,
            to_user_id: randomUser.sync_id,
          };
          // find users
        }

        // Prepare the request promise
        const sendPromise = api
          .post(
            route === "/transactions" ? "/me/transactions" : "/users",
            body,
            { timeout: 100000 }
          )
          .then(() => ({
            success: true,
            message: `Send ${index + 1}: Success`,
          }))
          .catch((error) => {
            const errorMessage = error.response
              ? `Error ${error.response.status}: ${error.response.data.message}`
              : "Connection Error";
            return {
              success: false,
              message: `Send ${index + 1}: ${errorMessage}`,
            };
          })
          .then((result) => {
            setResults((prevResults) => {
              const updatedResults = [...prevResults];
              updatedResults[index] = result;
              return updatedResults;
            });
          });

        chunkPromises.push(sendPromise);
      }

      // Wait for all promises in this chunk
      return Promise.allSettled(chunkPromises);
    };

    // Function to send chunks with limited concurrency
    const sendChunks = async () => {
      const chunkGroups = [];

      for (let i = 0; i < totalChunks; i += MAX_CONCURRENT_CHUNKS) {
        const chunkGroup = [];

        // eslint-disable-next-line no-plusplus
        for (let j = 0; j < MAX_CONCURRENT_CHUNKS; j++) {
          const chunkIndex = i + j;
          if (chunkIndex >= totalChunks) break;
          chunkGroup.push(sendChunk(chunkIndex));
        }

        // Process a group of chunks in parallel
        // eslint-disable-next-line no-await-in-loop
        await Promise.all(chunkGroup);
        console.log(
          `Chunks ${i + 1} to ${Math.min(
            i + MAX_CONCURRENT_CHUNKS,
            totalChunks
          )} completed`
        );
      }
    };

    // Start sending chunks
    await sendChunks();

    setLoading(false);
  }, [route, quantity]);

  // const handleSubmitBackend = useCallback(async () => {
  //   setLoading(true);
  //   setStartTime(new Date());
  //   setElapsedTime("00:00:00.000");

  //   const halfQuantity = Math.floor(quantity / 2); // Divide a quantidade em dois
  //   const formData1 = { quantity: halfQuantity, route };
  //   const formData2 = { quantity: quantity - halfQuantity, route };

  //   try {
  //     const [response1, response2] = await Promise.all([
  //       api.post("/laboratory", formData1, { timeout: 100000 }),
  //       api.post("/laboratory", formData2, { timeout: 100000 }),
  //     ]);

  //     console.log("Response 1:", response1);
  //     console.log("Response 2:", response2);
  //   } catch (error) {
  //     console.log(error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, [quantity, route]);

  const handleSubmitBackend = useCallback(async () => {
    setLoading(true);
    setStartTime(new Date());
    setElapsedTime("00:00:00.000");

    const CHUNK_SIZE = 50; // Divida em blocos menores para controle
    const chunks = Math.ceil(quantity / CHUNK_SIZE); // Número total de chunks

    const createFormData = (startIndex: number, chunkSize: number) => ({
      quantity: chunkSize,
      route,
    });

    const chunkPromises = [];

    try {
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < chunks; i++) {
        const startIndex = i * CHUNK_SIZE;
        const currentChunkSize = Math.min(CHUNK_SIZE, quantity - startIndex);

        // Criar formData para o chunk atual
        const formData = createFormData(startIndex, currentChunkSize);

        const requestPromise = api
          .post("/laboratory", formData, { timeout: 100000 })
          .then((response) => ({
            success: true,
            response,
          }))
          .catch((error) => ({
            success: false,
            error: error.response
              ? `Error ${error.response.status}: ${error.response.data.message}`
              : "Connection Error",
          }));

        chunkPromises.push(requestPromise);
      }

      // Executar todos os chunks em paralelo, e esperar todos completarem
      const results = await Promise.allSettled(chunkPromises);

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          console.log(`Chunk ${index + 1} Success:`, result.value);
        } else {
          console.error(`Chunk ${index + 1} Failed:`, result.reason.error);
        }
      });
    } catch (error) {
      console.log("Unexpected Error:", error);
    } finally {
      setLoading(false);
    }
  }, [quantity, route]);

  return (
    <Container>
      <header>
        <div>
          <ButtonBack
            mobileTitle="Laboratory"
            title="Laboratory"
            goTo="/dashboard"
          />
        </div>
      </header>
      <Content>
        <div className="section">
          <div>
            <label htmlFor="processMode">Select Process Mode:</label>
            <select
              id="processMode"
              value={processMode}
              onChange={(event) => setPorcessMode(event.target.value)}
            >
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
            </select>
          </div>
          <div>
            <label htmlFor="route">Select Route:</label>
            <select id="route" value={route} onChange={handleRouteChange}>
              <option value="/users">/users</option>
              <option value="/transactions">/transactions</option>
            </select>
          </div>
          <div>
            <label htmlFor="quantity">Number of Sends:</label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={handleQuantityChange}
              min="1"
            />
          </div>
          <Button
            onClick={
              processMode === "frontend" ? handleSubmit : handleSubmitBackend
            }
            disabled={loading}
          >
            {loading ? "Sending..." : "Start Test"}
          </Button>
          <p>Elapsed Time: {elapsedTime}</p>
          {loading && (
            <p>
              Sending {results.filter((r) => r.success !== null).length}/
              {quantity}...
            </p>
          )}
          <ul>
            {results.map((result, index) => (
              <li
                key={index}
                style={{
                  color:
                    result.success === null
                      ? "blue"
                      : result.success
                      ? "green"
                      : "red",
                }}
              >
                {result.message}
              </li>
            ))}
          </ul>
        </div>
      </Content>
    </Container>
  );
};

export default Laboratory;
