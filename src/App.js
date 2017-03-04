import React, { PropTypes } from 'react';
import axios from 'axios';
import JSAlert from 'js-alert';
import { Button, Modal, ButtonToolbar, Grid, Row, Col, Thumbnail } from 'react-bootstrap';
import './App.css';

export default class App extends React.Component {

  constructor() {
    super();
    this.state = {
      movies: [],
      showModal: false,
      movieIdEdit: null,
      moviePlotEdit: null,
      movieTitleEdit: null,
      movieListReversed: false
    };

    // functions binding
    this.pushDataToFirebase = this.pushDataToFirebase.bind(this);
    this.pullData = this.pullData.bind(this);
    this.deleteMovie = this.deleteMovie.bind(this);
    this.showModal = this.showModal.bind(this);
    this.hideModal = this.hideModal.bind(this);
    this.editMovie = this.editMovie.bind(this);
    this.moviesData = this.moviesData.bind(this);
    this.showEditDetails = this.showEditDetails.bind(this);
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
          this.pushDataToFirebase(movieObj);
          this.moviesData();
        }
      })
      .catch((message) => {
        // console.log(message);
      });
    }

    deleteMovie(movieTitle){
      let deleteKey = "";
      axios({
        url: `/moviesList/.json`,
        baseURL: 'https://react-on-rails-movies.firebaseio.com',
        method: "GET",
      })
      .then((response) => {
        for (var movieKey in response.data) {
          if (movieTitle === response.data[movieKey].Title) {
            // console.log(movieKey);
            deleteKey = movieKey;
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
            if (el.Title !== movieTitle) {
              updateArray.push(el);
            }
          })
          this.setState({
            movies: updateArray
          })
        })
      })
    }

    showModal(movieId, moviePlot, movieTitle){
      // console.log(movieId);
      this.setState({
        showModal: true,
        movieIdEdit: movieId,
        moviePlotEdit: moviePlot,
        movieTitleEdit: movieTitle
      })
    }

    hideModal(){
      this.setState({
        showModal: false
      })
    }

    editMovie(updatedPlot){
      this.hideModal();
      let editKey = "";
      axios({
        url: `/moviesList/.json`,
        baseURL: 'https://react-on-rails-movies.firebaseio.com',
        method: "GET",
      })
      .then((response) => {
        for (var movieKey in response.data) {
          if (this.state.movieIdEdit === response.data[movieKey].id) {
            console.log(movieKey);
            editKey = movieKey;
          }
        }
        // https://react-on-rails-movies.firebaseio.com/moviesList/-KdcOgCxuNSvHxna1v61/Plot
        axios({
          url: `/moviesList/${editKey}/.json`,
          baseURL: 'https://react-on-rails-movies.firebaseio.com/',
          method: "PATCH",
          data: {'Plot': updatedPlot}
        })
        .then((response) => {
          // console.log(response);
          // update the state with new edited Plot
          this.componentDidMount();
        })
      })
    }

    moviesData(){
        return (
            this.state.movies.reverse().map(movie =>
              <Col xs={12} sm={4} md={3} lg={3} className="oneDetailBox">
                <Thumbnail>
                  <img src={movie.Poster} />
                  <h3 >{movie.Title}</h3>
                  <hr />
                  <p className="moviePlotBox" id={movie.id}>{movie.Plot}</p>
                  <p>
                    <Button onClick={() => { this.deleteMovie(movie.Title) }}>More Info</Button>&nbsp;
                    <Button bsStyle="primary" data-target="#contained-modal-title-lg"
                          onClick={() => this.showModal(movie.id, movie.Plot, movie.Title)}>Edit</Button>&nbsp;
                    <Button bsStyle="danger" onClick={() => { this.deleteMovie(movie.Title) }}>Delete</Button>
                  </p>
                </Thumbnail>
              </Col>
            )
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
                ref={(input) => { this.movieTitleInput = input; }}
                placeholder="Enter Movie Title You Want To Add"
                size="70"
              />
              <br /><br />
              <Button
                bsStyle="primary"
                onClick={() => {
                    // console.log(this.movieTitleInput.value);
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
        {this.showEditDetails()}

      </div>
    );
  }
}
