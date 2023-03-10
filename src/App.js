import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useEffect } from "react";
import { Configuration, OpenAIApi } from "openai";
import MainPage from "./Pages/MainPage";
import JoinPage from "./Pages/JoinPage";
import Banner from "./Components/Banner";
import PostBox from "./Components/PostBox";
import { Routes, Route, Link, useParams, useSearchParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const client_id = process.env.REACT_APP_CLIENT_ID;
const client_secret = process.env.REACT_APP_CLIENT_SECRET;
const weather_api_key = process.env.REACT_APP_WEATHER_API_KEY;
const openai_api_key = process.env.REACT_APP_OPENAI_API_KEY;

function App() {
  const [accessToken, setAccessToken] = useState("");
  const [albums, setAlbums] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [artistPlaylists, setArtistPlaylists] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [playlistTag, setPlaylistTag] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [trackTag, setTrackTag] = useState(false);
  const [artists, setArtists] = useState([]);
  const [artistTag, setArtistTag] = useState(false);
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [weather, setWeather] = useState("");
  const [mood, setMood] = useState("");
  const [moodTag, setMoodTag] = useState(false);
  const [randomNum, setRandomNum] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    //API access token
    var authParameters = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&client_id=" + client_id + "&client_secret=" + client_secret,
    };

    fetch("https://accounts.spotify.com/api/token", authParameters)
      .then((result) => result.json())
      .then((data) => setAccessToken(data.access_token));

    //????????? ???????????? ???????????? ????????? ?????? ??????
    setRandomNum(Math.floor(Math.random() * 20));

    //??????&?????? ????????? ??? ai??? mood????????????
    function getWeatherAndMood(position) {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weather_api_key}`;
      fetch(weatherUrl)
        .then((response) => response.json())
        .then((result) => {
          const ?????? = Math.round(Number(result.main.temp) - 273.15);
          const ?????? = result.main.humidity;
          const ?????? = result.weather[0].main;
          setTemperature(??????);
          setHumidity(??????);
          setWeather(??????);
          console.log(?????? + "??C", ?????? + "%", ??????);

          const configuration = new Configuration({
            apiKey: openai_api_key,
          });
          const openai = new OpenAIApi(configuration);

          //ai??? ????????? ???????????? ????????? ????????????->mood
          openai
            .createCompletion({
              model: "text-davinci-003",
              prompt: `Current weather conditions are ${weather}, temperature is ${temperature}, humidity is ${humidity}. Based on the given weather, temperature, and humidity, please present the appropriate atmosphere in one Korean keyword. Be careful not to suggest anything out of step with the weather.`,
              temperature: 0.7,
              max_tokens: 256,
              top_p: 1,
              frequency_penalty: 0,
              presence_penalty: 0,
            })
            .then((result) => {
              setMood(result.data.choices[0].text);
            })
            .then(() => {
              setMoodTag(true);
            });
        });
    }
    //??????&?????? ????????????
    navigator.geolocation.getCurrentPosition(getWeatherAndMood, () => {
      console.log("Can't find you.");
    });

  }, []);

  //mood??? ??????????????? ?????? ?????? ??????
  useEffect(() => {
    if (mood) {
      recommendSpotify();
      console.log(randomNum);
    }
  }, [mood]);

  //???????????? ??????
  async function searchSpotify() {
    var searchParameters = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accessToken,
      },
    };

    let artistID = await fetch(`https://api.spotify.com/v1/search?q=${searchInput}&type=artist`, searchParameters)
      .then((response) => response.json())
      .then((data) => {
        setSearchParams({ q: searchInput });
        return data.artists.items[0].id;
      });

    await fetch("https://api.spotify.com/v1/artists/" + artistID + "/albums?include_groups=album&market=KR&limit=50", searchParameters)
      .then((response) => response.json())
      .then((data) => {
        setAlbums(data.items);
      });

    await fetch("https://api.spotify.com/v1/artists/" + artistID + "/top-tracks?market=KR", searchParameters)
      .then((response) => response.json())
      .then((data) => {
        setTopTracks(data.tracks);
      });

    await fetch("https://api.spotify.com/v1/search?q=" + artistID + "&type=playlist", searchParameters)
      .then((response) => response.json())
      .then((data) => {
        setArtistPlaylists(data.playlists.items);
      });

    document.querySelector(".search-enter").click();
  }

  async function recommendSpotify() {
    console.log("Search for " + mood);

    var searchParameters = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };

    await fetch("https://api.spotify.com/v1/search?q=" + mood + "&type=playlist", searchParameters)
      .then((response) => response.json())
      .then((data) => {
        setPlaylists(data.playlists.items);
        console.log(data.playlists.items);
      })
      .then(() => {
        setPlaylistTag(true);
      });

    await fetch("https://api.spotify.com/v1/search?q=" + mood + "&type=track", searchParameters)
      .then((response) => response.json())
      .then((data) => {
        setTracks(data.tracks.items);
      })
      .then(() => {
        setTrackTag(true);
      });

    await fetch("https://api.spotify.com/v1/search?q=" + mood + "&type=artist", searchParameters)
      .then((response) => response.json())
      .then((data) => {
        setArtists(data.artists.items);
      })
      .then(() => {
        setArtistTag(true);
      });
  }

  

  return (
    <Routes>
      <Route
        path="/"
        element={
          <MainPage
            moodTag={moodTag}
            playlistTag={playlistTag}
            playlists={playlists}
            trackTag={trackTag}
            tracks={tracks}
            artistTag={artistTag}
            artists={artists}
            randomNum={randomNum}
            mood={mood}
            weather={weather}
            temperature={temperature}
          />
        }
      />

      <Route path="/join" element={<JoinPage mood={mood} />} />
      <Route
        path="/post"
        element={
          <>
            <div className="post-top">
              <div className="search-form">
                <div className="form" style={{ width: "100%" }}>
                <input
                    className="search-input"
                    type="input"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        searchSpotify();
                        document.querySelector(".search-enter").click();
                      }
                    }}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                    }}
                    placeholder="?????? ??????, ?????? ??????, ?????? ???????????? ???????????????."
                    required=""
                  />

                  <Link to="/search">
                    <button onClick={
                      searchSpotify
                      } className="search-enter">
                      ??????
                    </button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="post-content">
              <div className="post-content-side">
                <Banner />
              </div>

              <div className="post-content-main">
                <div className="post-content-post-box">
                  <PostBox />
                  <PostBox />
                  <PostBox />
                  <PostBox />
                  <PostBox />
                </div>
              </div>
            </div>
          </>
        }
      />
      <Route
        path="/search"
        element={
          <>
            <div className="post-top">
              <div className="search-form">
                <div className="form" style={{ width: "100%" }}>
                  <input
                    className="search-input"
                    type="input"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        searchSpotify();
                      }
                    }}
                    onChange={(e) => {
                      setSearchInput(e.target.value);
                    }}
                    placeholder="?????? ??????, ?????? ??????, ?????? ???????????? ???????????????."
                    required=""
                  />
                  <button onClick={searchSpotify} className="search-enter">
                    ??????
                  </button>
                </div>
              </div>
            </div>
            <div className="post-content">
              <div className="post-content-side">
                <Banner />
              </div>

              <div className="post-content-main row">
                <div className="search-result col">
                  <h2 style={{ color: "#F2F2F2", marginBottom: "10px", fontWeight: "900" }}>TopTracks</h2>
                  <div className="post-content-result">
                    {topTracks.map((topTrack, i) => {
                      return (
                        <div className="result-box" onClick={() => window.open(`${topTrack.external_urls.spotify}`, "_blank")}>
                          <div className="result-box-card">
                            <div className="result-box-card-cover">
                              <img src={topTrack.album.images[0].url} />
                            </div>
                            <div className="result-box-card-title">
                              <p style={{ fontWeight: "700" }}>{topTrack.name}</p>
                              <p style={{ fontSize: "15px" }}>{topTrack.artists[0].name}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="search-result col">
                  <h2 style={{ color: "#F2F2F2", marginBottom: "10px", fontWeight: "900" }}>Albums</h2>
                  <div className="post-content-result">
                    {albums.map((album, i) => {
                      return (
                        <div className="result-box" onClick={() => window.open(`${album.external_urls.spotify}`, "_blank")}>
                          <div className="result-box-card">
                            <div className="result-box-card-cover">
                              <img src={album.images[0].url} />
                            </div>
                            <div className="result-box-card-title">
                              <p style={{ fontWeight: "700" }}>{album.name}</p>
                              <p style={{ fontSize: "15px" }}>{album.artists[0].name}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="search-result col">
                  <h2 style={{ color: "#F2F2F2", marginBottom: "10px", fontWeight: "900" }}>Playlists</h2>
                  <div className="post-content-result">
                    {artistPlaylists.map((artistPlaylist, i) => {
                      return (
                        <div className="result-box" onClick={() => window.open(`${artistPlaylist.external_urls.spotify}`, "_blank")}>
                          <div className="result-box-card">
                            <div className="result-box-card-cover">
                              <img src={artistPlaylist.images[0].url} />
                            </div>
                            <div className="result-box-card-title">
                              <p style={{ fontWeight: "700" }}>{artistPlaylist.name}</p>
                              <p style={{ fontSize: "15px" }}>{artistPlaylist.owner.display_name}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        }
      />
    </Routes>
  );
}

export default App;
