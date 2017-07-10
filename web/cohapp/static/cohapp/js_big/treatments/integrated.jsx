import {my_urls} from '../components/jsx-strings.jsx';
import {getPlainText} from '../components/helperfunctions.js';
import Instruction from '../components/instruction.jsx';
import Preloader from '../components/preloader.jsx';
import Editor from '../components/editor.jsx';
import Revision from '../components/revision.jsx';
import HeaderExperiment from '../components/header-experiment.jsx';
import 'whatwg-fetch';

class TreatmentIntegrated extends React.Component {
  constructor(props) {
    super(props);

    var self = this;

    // Setup state variables
    this.state = {
      // Meta variables
      user: null,
      measurement: null,
      // Display variables
      showEditor: false,
      showInstruction: false,
      showRevisionPrompt: false,
      showRevision: false,
      showThankYouPage: false,
      // State variables
      seenInstruction: false,
      seenEditor: false,
      seenRevisionPrompt: false,
      seenRevision: false,
      // Data variables
      // durationDraft: null,
      draftAnalyzed: null,
      draftText: '',
      draftPlainText: '',
      revisionAnalyzed: null,
      revisionText: '',
      revisionPlainText: ''
    };

    // Get urls
    this.urls = my_urls;

    // Get hash of experiment
    var path = window.location.href;
    this.experiment_id = path.substr(path.lastIndexOf('/') + 1);

    // Fetch user data
    fetch(this.urls.user_specific + this.experiment_id, {
      method: 'GET',
      credentials: "same-origin"
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      console.log(data);
      self.setState({user: data});
    });

    // Fetch measurement data
    fetch(this.urls.measurement + this.experiment_id, {
      method: 'GET',
      credentials: 'same-origin'
    }).then(function(response) {
      return response.json();
    }).then(function(data) {
      self.setState({measurement: data[0],
                     showInstruction: true});
    });

    // Bind this to methods
    this.analyzeText = this.analyzeText.bind(this);
    this.analyzeRevision = this.analyzeRevision.bind(this);
    this.updateDraft = this.updateDraft.bind(this);
    this.updateRevision = this.updateRevision.bind(this);
    this.renderInstruction = this.renderInstruction.bind(this);
    this.renderEditor = this.renderEditor.bind(this);
    this.renderRevisionPrompt = this.renderRevisionPrompt.bind(this);
    this.renderRevision = this.renderRevision.bind(this);
    this.userClickedInstruction = this.userClickedInstruction.bind(this);
    this.userClickedRevisionPrompt = this.userClickedRevisionPrompt.bind(this);
    this.sendDataToServer = this.sendDataToServer.bind(this);
  }

  render() {
    // Show preloader if state user not shown
    let template = <Preloader />;

    // User data has been fetched
    if (this.state.user != null || this.state.measurement) {
      // Measurement data has been fetched
      if (this.state.measurement != null) {

        // Render instruction
        if (this.state.showInstruction) {
          // Render instruction for current measurement
          template = <Instruction
              instructionText={this.state.measurement.instruction}
              renderNextState={this.userClickedInstruction} />;
        // Render editor
        } else if (this.state.showEditor) {
            template = <Editor analyzeText={this.analyzeText}
                             updateDraft={this.updateDraft}
                             draftText={this.state.draftText}
                             editorVisible={this.state.showEditor} />;
        // Render prompt for revision
        } else if (this.state.showRevisionPrompt) {
          template = <Instruction
              instructionText={this.state.measurement.instruction_review}
              renderNextState={this.userClickedRevisionPrompt}
              seenInstruction={this.state.seenInstruction}
              draftAnalyzed={this.state.draftAnalyzed} />;
        // Render editor to revise draft
        } else if (this.state.showRevision) {
          template = <Revision measurement={this.state.user.next_measure}
                               draftText={this.state.draftText}
                               draftAnalyzed={this.state.draftAnalyzed}
                               updateRevision={this.updateRevision}
                               editorVisible={this.state.showRevision}
                               revisionText={this.state.revisionText}
                               analyzeRevision={this.analyzeRevision} />;
        // Show thankyoupage
        } else if (this.state.showThankYouPage) {

        }
      }
    }

    return (
      <div>
          <HeaderExperiment showEditor={this.state.showEditor}
                            showInstruction={this.state.showInstruction}
                            showRevisionPrompt={this.state.showRevisionPrompt}
                            showRevision={this.state.showRevision}
                            renderInstruction={this.renderInstruction}
                            renderEditor={this.renderEditor}
                            renderRevisionPrompt={this.renderRevisionPrompt}
                            renderRevision={this.renderRevision} />
         {template}
      </div>
    );
  }

  /**
   * Render instruction of experiment
   * We want to give users control to
   * have another look at the instruction
   * @return {None}
   */
  renderInstruction() {
    this.setState({showEditor: false, showInstruction: true,
                   showRevisionPrompt: false, showRevision: false});
  }

  /**
   * Render editor when user clicks
   * that she has read the instruction
   * @return {None}
   */
  renderEditor() {
    // Only render editor if the instruction has been read
    if (this.state.seenInstruction) {
      // Display editor by state change
      this.setState({showEditor: true, showInstruction: false,
                     showRevisionPrompt: false, showRevision: false});
    }

  }

  /**
   * Render revision prompt
   * @return {undefined}
   */
  renderRevisionPrompt() {
    // Only render revision prompt if instruction has been read
    // and text has been written
    if (this.state.seenInstruction && this.state.seenEditor) {
      this.setState({showEditor: false, showInstruction: false,
                     showRevisionPrompt: true, showRevision: false});
    }
  }

  /**
   * Render revision
   * @return {undefined}
   */
  renderRevision() {
    // Only render revision prompt if instruction has been read
    // and text has been written and revision prompt has been read
    if (this.state.seenInstruction && this.state.seenEditor &&
        this.state.seenRevisionPrompt) {
      this.setState({showEditor: false, showInstruction: false,
                     showRevisionPrompt: false, showRevision: true});
    }
  }

  /**
   * When user clicks the instruction we
   * want to know that and only display
   * the revisionprompt or the revision if
   * the instruction has been read
   * @return {undefined}
   */
  userClickedInstruction() {
    this.setState({'seenInstruction': true}, () => {
      this.renderEditor();
    })
  }

  /**
   * When user clicks the instruction for the
   * revision prompt allow user to use the
   * revision prompt tab
   * @return {undefined}
   */
  userClickedRevisionPrompt() {
    this.setState({'seenRevisionPrompt': true}, () => {
      this.renderRevision();
    })
  }

  /**
   * Analyze Text
   */
  analyzeText() {
    var self = this;

    this.setState({showEditor: false, showInstruction: false,
                   showRevisionPrompt: true, showRevision: false,
                   draftAnalyzed: null});

    // Save time for draft
    // this.setState({durationDraft: (new Date() - this.state.durationDraft) / 1000});

    this.setState({'draftPlainText': getPlainText(this.state.draftText)}, () => {
      // Analyze Text
      fetch(this.urls.textanalyzer + this.experiment_id, {
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({
          text: self.state.draftPlainText
        }),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      }).then((response) => {
        return response.json();
      }).catch((error) => {
        console.log(error);
      }).then((data) => {
        self.setState({'draftAnalyzed': data, 'revisionText': data.html_string,
               'seenEditor': true});
      });
    });
  }

  /**
   * Analyze Text
   */
  analyzeRevision() {
    var self = this;

    this.setState({showEditor: false, showInstruction: false,
                   showRevisionPrompt: false, showRevision: false});

    // Save time for draft
    // this.setState({durationDraft: (new Date() - this.state.durationDraft) / 1000});

    // console.log(getPlainText(this.state.revisionText));
    this.setState({'revisionPlainText': getPlainText(this.state.revisionText)}, () => {
      // console.log(self.state.revisionPlainText);
      // Analyze Text
      fetch(this.urls.textanalyzer + this.experiment_id, {
        method: 'POST',
        credentials: 'same-origin',
        body: JSON.stringify({
          text: self.state.revisionPlainText
        }),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      }).then((response) => {
        return response.json();
      }).catch((error) => {
        console.log(error);
      }).then((data) => {
        self.setState({'revisionAnalyzed': data,
                showEditor: false, showInstruction: false,
                showRevisionPrompt: false, showRevision: false,
                showThankYouPage: true}, () => {
                  self.sendDataToServer();
        });
      });
    });
  }

  /**
   * Store text from draft
   */
  updateDraft(text) {
    this.setState({'draftText': text});

    // Store text in local storage
    if (typeof(Storage) !== "undefined") {
      localStorage.setItem('textdraft', text);
    }
  }

  /**
   * Store text from revision
   */
  updateRevision(text) {
    this.setState({'revisionText': text});

    // Store text in local storage
    if (typeof(Storage) !== "undefined") {
      localStorage.setItem('textrevision', text);
    }
  }

  /**
   * Send data to server
   */
  sendDataToServer() {
    console.log('send');
  }
}

ReactDOM.render(
  <TreatmentIntegrated />,
  document.getElementById('treatment-integrated')
);
