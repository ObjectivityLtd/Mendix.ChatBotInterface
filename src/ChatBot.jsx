import { Component, createElement } from "react";
import { hot } from "react-hot-loader/root";
import ReactWebChat, { createDirectLine, createStore } from "botframework-webchat";
import "./ui/ChatBot.css";

class ChatBot extends Component {
    constructor(props) {
        super(props);
        const appProfile = this.getApplicationProfile();
        this.state = {
            hideUploadButton: !props.upload,
            wrapTitle: props.wrapTitle,
            widgetReady: false,
            currentPath: "",
            profile: appProfile,
            lastUserText: ""
        };
        this.onPageChange = this.onPageChange.bind(this);
        this.onWrapperClick = this.onWrapperClick.bind(this);
    }

    componentDidMount() {
        const interval = setInterval(() => {
            if (
                this.props.username.status === "available" &&
                this.props.userid.status === "available" &&
                this.props.useremail.status === "available" &&
                this.props.secret.status === "available" &&
                this.props.enablechatbot.status === "available"
            ) {
                if (!this.isBotEnabled()) {
                    clearInterval(interval);
                    return;
                }
                var pageContext = this.translateContext(window.mx.ui.getContentForm().path);
                var store = this.dispatchStoreContext(pageContext, this.props.useremail.value, this.state.appProfile);
                const directLine = createDirectLine({
                    secret: this.props.secret.value,
                    webSocket: this.props.useWebsockets
                });
                this.setState({
                    directLine: directLine,
                    widgetReady: true,
                    store: store,
                    currentPath: window.mx.ui.getContentForm().path
                });
                document.addEventListener("pageChanged", this.onPageChange);
                if (this.props.wrapperClass.value !== "") {
                    document
                        .querySelector("." + this.props.wrapperClass)
                        .querySelector(".mx-groupbox-header")
                        .addEventListener("click", this.onWrapperClick);
                }
                clearInterval(interval);
            }
        }, 50);
    }

    getApplicationProfile() {
        if (window && window.cordova) {
            return "mobile";
        } else if (navigator && navigator.product === "ReactNative") {
            return "mobile";
        } else {
            return "web";
        }
    }

    isBotEnabled() {
        return this.props.enablechatbot.value === true;
    }

    onPageChange = event => {
        if (window.mx.ui.getContentForm().path !== this.state.currentPath) {
            var pageContext =
                event.detail === undefined ? this.translateContext(window.mx.ui.getContentForm().path) : event.detail;
            this.state.store.dispatch({
                type: "WEB_CHAT/SEND_EVENT",
                payload: {
                    name: "context/set",
                    value: {
                        app: this.state.profile, //web/mobil
                        context: pageContext
                    }
                }
            });
            this.setState({ currentPath: window.mx.ui.getContentForm().path });
        }
    };

    scrollIntoLastMessage() {
        //if your message is the last one, wait else - scroll
        var message;
        var messages;
        if (this.state.lastUserText === "") {
            document.querySelector("ul[role='list']").lastChild.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }
        const scrollInterval = setInterval(() => {
            messages = document.querySelector("ul[role='list']").children;
            if (messages[messages.length - 1].children[0].querySelector(".from-user") === null) {
                for (var i = messages.length - 2; i >= 0; i--) {
                    if (
                        messages[i].lastChild.children[0].children[0].children[1].children[0].innerText ===
                        this.state.lastUserText
                    ) {
                        message = messages[i + 1];
                        break;
                    }
                }
            }
            if (message !== undefined) {
                message.scrollIntoView({ behavior: "smooth", block: "start" });
                clearInterval(scrollInterval);
            }
        }, 50);
    }

    onWrapperClick() {
        var maxAttempts = 10;
        var attempts = 0;
        const wrapperInterval = setInterval(() => {
            try {
                this.scrollIntoLastMessage();
                clearInterval(wrapperInterval);
            } catch (error) {
                if (attempts === maxAttempts) {
                    console.error(
                        "Reached maximum number of attempts to execute on click action. Task has been terminated."
                    );
                    console.error(error);
                    clearInterval(wrapperInterval);
                } else {
                    attempts++;
                }
            }
        }, 50);
    }

    componentWillUnmount() {
        removeEventListener("pageChanged", this.onPageChange);
    }

    dispatchStoreContext(context, useremail) {
        return createStore({}, ({ dispatch }) => next => action => {
            if (action.type === "DIRECT_LINE/CONNECT_FULFILLED") {
                dispatch({
                    type: "WEB_CHAT/SEND_EVENT",
                    payload: {
                        name: "webchat/join"
                    }
                });
                dispatch({
                    type: "WEB_CHAT/SEND_EVENT",
                    payload: {
                        name: "context/set",
                        value: {
                            app: this.state.profile, //web/mobile,
                            context: context
                        }
                    }
                });
                dispatch({
                    type: "WEB_CHAT/SEND_EVENT",
                    payload: {
                        name: "user/set",
                        value: {
                            email: useremail
                        }
                    }
                });
            } else if (
                action.type === "DIRECT_LINE/INCOMING_ACTIVITY" &&
                action.payload.activity.from.role === "user" &&
                action.payload.activity.type === "message"
            ) {
                this.setState({
                    lastUserText: action.payload.activity.text
                });
            } else if (
                action.type === "DIRECT_LINE/INCOMING_ACTIVITY" &&
                action.payload.activity.from.role === "bot" &&
                action.payload.activity.type === "message"
            ) {
                try {
                    this.scrollIntoLastMessage();
                } catch (error) {
                    //Could not scroll into message - conversation box hidden.
                }
            }
            return next(action);
        });
    }

    translateContext(page) {
        switch (page) {
            case "DataManagement/Carer_Profile.page.xml":
                return "List of children";
            case "DataManagement/Carer_Profile_Mobile.page.xml":
                return "List of children";
            case "DataManagement/Child_Profile.page.xml":
                return "Child profile";
            case "DataManagement/Child_Profile_Mobile.page.xml":
                return "Child profile";
            case "DataManagement/Child_ProfileDetails.page.xml":
                return "Child profile";
            case "DataManagement/Child_ProfileDetails_Mobile.page.xml":
                return "Child profile";
            case "EarlyYears.Form_NBAS_Mobile.page.xml":
                return "WellComm, NBO and NBAS";
            case "EarlyYears.Form_NBAS.page.xml":
                return "WellComm, NBO and NBAS";
            case "EarlyYears.Form_ReadOnly_NBAS_Mobile.page.xml":
                return "WellComm, NBO and NBAS";
            case "EarlyYears.Form_ReadOnly_NBAS.page.xml":
                return "WellComm, NBO and NBAS";
            case "EarlyYears.Form_NBO_Mobile.page.xml":
                return "WellComm, NBO and NBAS";
            case "EarlyYears/Form_Summary_WellComm_ReadOnly_Mobile.page.xml":
                return "WellComm, NBO and NBAS";
            case "EarlyYears/Form_Summary_WellComm_Mobile.page.xml":
                return "WellComm, NBO and NBAS";
            case "EarlyYears/Form_Summary_WellComm_ReadOnly.page.xml":
                return "WellComm, NBO and NBAS";
            case "EarlyYears/Form_Summary_WellComm.page.xml":
                return "WellComm, NBO and NBAS";
            case "EarlyYears/Form_SingleSection.page.xml":
                try {
                    switch (window.mx.ui.getContentForm()._context.trackObject.jsonData.attributes.FormType.value) {
                        case "EPDS":
                            return "General Questions";
                        case "ASQ_3":
                            return "ASQ 3 and ASQ SE";
                        case "ASQ_SE_2":
                            return "ASQ 3 and ASQ SE";
                        case "NBAS":
                            return "WellComm, NBO and NBAS";
                        default:
                            return "General Questions";
                    }
                } catch (error) {
                    console.debug(error);
                    return "General Questions";
                }
            case "VideoGuidance/Guidance_Overview.page.xml":
                return "Videos";
            case "VideoGuidance/Guidance_Overview_Mobile.page.xml":
                return "Videos";
            case "Launchpad/User_Settings.page.xml":
                return "LaunchPad";
            case "Launchpad/AppList.page.xml":
                return "LaunchPad";
            default:
                return "General Questions";
        }
    }

    render() {
        if (this.props.enablechatbot.value === true) {
            const chatStyling = {
                hideUploadButton: this.state.hideUploadButton,
                richCardWrapTitle: this.state.wrapTitle
            };
            if (this.state.widgetReady) {
                return (
                    <div id="chatbot-container" style={this.props.style} className={this.props.class}>
                        <ReactWebChat
                            userID={this.props.userid.value}
                            username={this.props.username.value}
                            locale={"en-GB"}
                            directLine={this.state.directLine}
                            store={this.state.store}
                            styleOptions={chatStyling}
                        />
                    </div>
                );
            }
        }
        return null;
    }
}

export default hot(ChatBot);
