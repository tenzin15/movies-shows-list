import React, { PropTypes } from 'react';
import axios from 'axios';
import JSAlert from 'js-alert';
import { Button, Modal, ButtonToolbar, Grid, Row, Col, Thumbnail } from 'react-bootstrap';
import './App.css';
import alertify from 'alertify.js';

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      movies: [],
      showModal: false,
      movieListReversed: false,
      movieImageDetails: null,
      movieTitleDetails: null,
      movieRuntimeDetails: null,
      movieYearDetails: null,
      movieGenreDetails: null,
      moviePlotDetails: null,
      movieDirectorDetails: null,
      movieActorDetails: null,
    };

    // functions binding
    this.pushDataToFirebase = this.pushDataToFirebase.bind(this);
    this.pullData = this.pullData.bind(this);
    this.deleteMovie = this.deleteMovie.bind(this);
    this.showModal = this.showModal.bind(this);
    this.hideModal = this.hideModal.bind(this);
    this.moviesData = this.moviesData.bind(this);
    this.showDetails = this.showDetails.bind(this);
  }

  componentDidMount() {
     axios({
        url: `/moviesList/.json`,
        baseURL: 'https://react-on-rails-movies.firebaseio.com',
        method: "GET",
      })
      .then((response) => {
        let dataFromFirebase = [];
        Object.values(response.data).reverse().forEach(movie => {
          dataFromFirebase.push(movie);
        })
        this.setState({
          movies: dataFromFirebase
        })
      })
  }

  pushDataToFirebase(movie){
      axios({
        url: `/moviesList/.json`,
        baseURL: 'https://react-on-rails-movies.firebaseio.com',
        method: "POST",
        data: movie
      })
      .then((response) => {
        // console.log(response.data);
      })
  }

  pullData(movieTitle){
      console.log(movieTitle);
      // parsing the movie title for the right format for the api call
      var array = movieTitle.split(' ');
      var movieTitleParsed = "";
      array.forEach((el,idx) => {
        if (el.length > 0) {
          if (idx === array.length-1)
            movieTitleParsed += el;
          else
            movieTitleParsed += el + "+";
        }
      })

      axios({
        url: `http://www.omdbapi.com/?t=${movieTitleParsed}&y=&plot=full&r=json`,
        method: "GET"
      })
      .then((response) => {
        // if the movie title is not found in the api call, then alert 'Not Found!'
        if(response.data['Response'] === 'False') {
          // alert('Sorry, Movie Not Found!')
          JSAlert.alert(`Sorry, movie not found! Is '${movieTitle}' spelled right?`);
        }
        else {
          var movieObj = response.data;
          // unique timestamp for the id of the editing
          var timestamp = new Date().getTime();
          movieObj.id = timestamp;
          var movies = this.state.movies;
          movies.push(movieObj);
          this.setState({
            movies
          })
          // new movie added successfully msg
          const msg = "<p>Movie Added Succesfully!</p><hr/>"
            + `<img src=${movieObj.Poster}>` +
            `<h3>${movieObj.Title}</h3>`;
          alertify.log(msg);

          this.pushDataToFirebase(movieObj);
          this.moviesData();
        }
      })
      .catch((message) => {
        // console.log(message);
      });
    }

    deleteMovie(movieID){
      let deleteKey = "";
      let moviePosterURL = null;
      let movieTitle = null;
      axios({
        url: `/moviesList/.json`,
        baseURL: 'https://react-on-rails-movies.firebaseio.com',
        method: "GET",
      })
      .then((response) => {
        for (var movieKey in response.data) {
          if (movieID === response.data[movieKey].id) {
            deleteKey = movieKey;
            moviePosterURL = response.data[movieKey].Poster;
            movieTitle = response.data[movieKey].Title;
          }
        }
        axios({
          url: `/moviesList/${deleteKey}/.json`,
          baseURL: 'https://react-on-rails-movies.firebaseio.com/',
          method: "DELETE",
        })
        .then((response) => {
          var array = this.state.movies;
          var updateArray = [];
          array.forEach(el => {
            if (el.id !== movieID) {
              updateArray.push(el);
            }
          })
          // movie deleted successfully msg
          const msg = "<p>Movie Deleted Succesfully!</p><hr/>"
            + `<img src=${moviePosterURL}>` +
            `<h3>${movieTitle}</h3>`;
          alertify.log(msg);

          this.setState({
            movies: updateArray
          })
        })
      })
    }

    showModal(movieImage, movieTitle, movieRuntime, movieYear, movieGenre, moviePlot, movieDirector, movieActors) {
      // console.log(movieId);
      this.setState({
        showModal: true,
        movieImageDetails: movieImage,
        movieTitleDetails: movieTitle,
        movieRuntimeDetails: movieRuntime,
        movieYearDetails: movieYear,
        movieGenreDetails: movieGenre,
        moviePlotDetails: moviePlot,
        movieDirectorDetails: movieDirector,
        movieActorDetails: movieActors,
      })
    }

    hideModal(){
      this.setState({
        showModal: false
      })
    }

    moviesData(){
        return (
            this.state.movies.reverse().map(movie =>
              <Col xs={12} sm={6} md={4} lg={3} className="oneDetailBox">
                <Thumbnail>
                  <img src={movie.Poster} />
                  <h3>{movie.Title}&nbsp;
                    <i
                      className="fa fa-trash pull-right"
                      aria-hidden="true"
                      onClick={() => { this.deleteMovie(movie.id) }}>
                    </i>
                    <i className="fa fa-info-circle pull-right"
                       aria-hidden="true"
                       onClick={() => {
                        this.showModal(movie.Poster, movie.Title, movie.Runtime, movie.Year, movie.Genre, movie.Plot, movie.Director, movie.Actors)
                      }}>
                    </i>
                  </h3>
                  <hr />
                  <p className="moviePlotBox" id={movie.id}>{movie.Plot}</p>
                </Thumbnail>
              </Col>
            )
          )
    }

    showDetails() {
      return(
        <Grid>
        <Row>
        <Col xs={12} sm={12} md={12} lg={12}>
        <ButtonToolbar>
            <Modal
              show={this.state.showModal}
              onHide={() => this.hideModal()}
              dialogClassName="custom-modal"
            >
              <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-lg"><h3>{this.state.movieTitleDetails}</h3></Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <img src={this.state.movieImageDetails} />
                <h4>Title</h4>
                <h5>{this.state.movieTitleDetails}</h5>
                <h4>Runtime</h4>
                <h5>{this.state.movieRuntimeDetails}</h5>
                <h4>Year</h4>
                <h5>{this.state.movieYearDetails}</h5>
                <h4>Genre</h4>
                <h5>{this.state.movieGenreDetails}</h5>
                <h4>Plot</h4>
                <h5>{this.state.moviePlotDetails}</h5>
                <h4>Directors</h4>
                <h5>{this.state.movieDirectorDetails}</h5>
                <h4>Actors</h4>
                <h5>{this.state.movieActorDetails}</h5>
              </Modal.Body>
              <Modal.Footer>
                <Button bsStyle="primary" onClick={() => this.hideModal()}>Okay</Button>
              </Modal.Footer>
            </Modal>
          </ButtonToolbar>
          </Col>
          </Row>
          </Grid>
        )
    }

  render() {
    return (
      <div>
        <Grid>
          <Row>
            <Col xs={12} sm={12} md={12} lg={12}>
              <h1 className="text-center">Movies & TV Shows Playlist</h1>
            </Col>
          </Row>
          <Row>
            <Col xs={12} sm={12} md={12} lg={12}>
              <center>
              <input
                type="text"
                name="movieName"
                className="inputBox"
                ref={(input) => { this.movieTitleInput = input; }}
                placeholder="Enter Movie or TV Show Title"
                size="70"
              />
              <Button
                bsStyle="primary"
                onClick={() => {
                    this.pullData(this.movieTitleInput.value)
                    this.movieTitleInput.value = "";
                  }
                }
              >Add Movie</Button>
              <br /><br /><br />
              </center>
            </Col>
          </Row>
        </Grid>
        <Grid>
          <Row className="show-grid">
            {this.moviesData()}
          </Row>
        </Grid>
        {this.showDetails()}
      </div>
    );
  }
}
