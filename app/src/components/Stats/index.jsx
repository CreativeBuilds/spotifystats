import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
const moment = require('moment');

function TabContainer(props) {
  return (
    <Typography component="div" style={{ padding: 8 * 3 , height: "calc(100vh - 96px)"}}>
      {props.children}
    </Typography>
  );
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
};

const styles = theme => ({
  root: {
    flexGrow: 1,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
});

const returnTimeListenedFormat = value => {
  var seconds = moment.duration(value).seconds();
  if(seconds < 10){
    seconds = "0"+seconds;
  }
  var minutes = moment.duration(value).minutes();
  if(minutes < 10){
    minutes = "0"+minutes;
  }
  var hours = Math.trunc(moment.duration(value).asHours());
  if(hours < 10){
    hours = "0"+hours;
  }
  return `${hours}:${minutes}:${seconds}`
}


class ScrollableTabsButtonAuto extends React.Component {
  state = {
    value: 0,
  };

  handleChange = (event, value) => {
    this.setState({ value });
  };

  render() {
    const { classes } = this.props;
    const { value } = this.state;

    return (
      <div className={classes.root}>
        <AppBar position="static" color="default">
          <Tabs
            value={value}
            onChange={this.handleChange}
            indicatorColor="primary"
            textColor="primary"
            // scrollable
            // scrollButtons="auto"
            centered={true}
          >
            <Tab label="Current Song Stats" />
            <Tab label="Album Stats" />
            <Tab label="Overall Stats" />
          </Tabs>
        </AppBar>
        {value === 0 && <TabContainer>
          
          Length: {this.props.currentSong.songLength/1000}s <br/> 
          Total Times Listened: {this.props.currentSong.plays || 0} <br/>
          Total Time Listened: {returnTimeListenedFormat(this.props.currentSong.totalTimeListened) || returnTimeListenedFormat(0)}
          </TabContainer>}
        {value === 1 && <TabContainer>TODO: Show user how much they have listened to an album, top 5 songs they listen to from the album</TabContainer>}
        {value === 2 && <TabContainer>TODO: Show total time on spotify, overall play/pause, when user listens to music, what kind of music they listen to</TabContainer>}
      </div>
    );
  }
}

ScrollableTabsButtonAuto.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ScrollableTabsButtonAuto);