import React, { useEffect, useState } from "react";
import Search from "./components/Search";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import Pagination from "./components/Pagination";
import { useDebounce } from "use-debounce";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [trendingError, setTrendingError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const fetchTrendingMovies = async () => {
    setIsTrendingLoading(true);
    setTrendingError("");

    try {
      const endpoint = `${API_BASE_URL}/trending/movie/week`;
      const response = await fetch(endpoint, API_OPTIONS);

      if (response.status === 401) {
        throw new Error("Invalid API key");
      }
      if (response.status === 429) {
        throw new Error("Too many requests. Please try again later.");
      }
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: Failed to fetch trending movies`
        );
      }

      const data = await response.json();
      setTrendingMovies(data.results?.slice(0, 10) || []);
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
      setTrendingError(error.message || "Error fetching trending movies.");
    } finally {
      setIsTrendingLoading(false);
    }
  };

  const fetchMovies = async (query = "", page = 1) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(
            query
          )}&page=${page}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&page=${page}`;

      const response = await fetch(endpoint, API_OPTIONS);

      if (response.status === 401) {
        throw new Error("Invalid API key");
      }
      if (response.status === 429) {
        throw new Error("Too many requests. Please try again later.");
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch movies`);
      }

      const data = await response.json();

      if (data.response === "False") {
        setErrorMessage(data.Error || "Failed to fetch movie");
        setMovieList([]);
        setTotalPages(1);
        setTotalResults(0);
        return;
      }

      setMovieList(data.results || []);
      setTotalPages(Math.min(data.total_pages || 1, 500));
      setTotalResults(data.total_results || 0);
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage(
        error.message || "Error fetching movies. Please try again later."
      );
      setMovieList([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);

    document
      .querySelector(".all-movies")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchTrendingMovies();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchMovies(debouncedSearchTerm, currentPage);
  }, [debouncedSearchTerm, currentPage]);

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="/hero-bg.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            Without the Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {!searchTerm && (
          <section className="trending-movies mt-[40px]">
            <h2 className="mb-4">🔥 Trending This Week</h2>
            {isTrendingLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : trendingError ? (
              <p className="text-red-500 text-center py-4">{trendingError}</p>
            ) : trendingMovies.length > 0 ? (
              <div className="trending-grid mb-8">
                <div className="overflow-x-auto">
                  <div
                    className="flex space-x-4 pb-4"
                    style={{ width: "max-content" }}
                  >
                    {trendingMovies.map((movie) => (
                      <div
                        key={`trending-${movie.id}`}
                        className="flex-shrink-0"
                      >
                        <MovieCard movie={movie} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        )}

        <section className="all-movies">
          <div className="flex justify-between items-center mt-[40px] mb-4">
            <h2>
              {searchTerm
                ? `Search Results for "${searchTerm}"`
                : "Popular Movies"}
            </h2>
            {totalResults > 0 && !isLoading && (
              <p className="text-gray-600">
                Showing page {currentPage} of {totalPages.toLocaleString()}(
                {totalResults.toLocaleString()} total results)
              </p>
            )}
          </div>

          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : movieList.length === 0 ? (
            <p className="text-gray-600">No movies found.</p>
          ) : (
            <>
              <ul>
                {movieList.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </ul>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
