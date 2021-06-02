import "./index.sass"
import React, { useEffect, useState, Component } from "react"
import Logo from "../../images/asanga_logo.svg";
import Logo_Text from "../../images/asanga_logo_text_purple.svg";
import Textarea from 'rc-textarea';


function prefixCls(x){
    return `asanga__${x}`
}

const ChatbotContext = React.createContext({
    messages: null,
});

class Chatbot extends Component{

    constructor(props) {
        super();
        this.state = {
            messages: [],
            input: "",
        };

        this.messageEl = React.createRef();
    }

    onInputchange = (event) => {
        this.setState({
            input: event.target.value
        });
    }

    scrollToBottom = (messageList) => {
        if(messageList) {
            messageList.scrollTop = 999999999;
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.messageEl.current && prevState.messages.length != this.state.messages.length) {
            this.scrollToBottom(this.messageEl.current);
        }
      }
        
    componentDidMount() {
    }

    componentWillUnmount() {
        
    }

    render() {    
        const handleTextInput = (event) => {
            event.preventDefault();
            event.stopPropagation();

            // Create a new array based on current state:
            let messages = [...this.state.messages];

            // print send message
            messages.push({"class":"send","text":event && event.target && event.target.value});

            // a fake response message
            messages.push({"class":"new","text":event && event.target && event.target.value});

            console.error("handleTextInput", {TextareaEvent: event, Value: event.target.value, Test: messages});

            // Set state
            this.setState({ messages: messages, input: "" });
        };

        return (
            <ChatbotContext.Provider value={{ messages: this.state.messages }}>
                <div className={prefixCls("inner")}>
                    <div className={prefixCls("top")}>
                        <div className={prefixCls("avatar")}>
                            <Logo/>
                            <Logo_Text/>
                        </div>
                    </div>
                    <div className={prefixCls("bottom")}>
                        <div className={prefixCls("chat")}>
                            <div 
                                className={prefixCls("messages")}
                                ref={this.messageEl} >
                                {this.state.messages.length > 0 ? this.state.messages.map((message) => (
                                    <div className={prefixCls("message ") + prefixCls(message.class)}>
                                        {message.text}
                                    </div>
                                )) :
                                <div className={prefixCls("message ") + prefixCls("new")}>
                                    Testing123
                                </div>                               
                                }
                            </div>
                            <div className={prefixCls("input ") + prefixCls("closed")}>
                                <Textarea 
                                    className={prefixCls("textarea")}
                                    autoSize={true}
                                    onPressEnter={handleTextInput}
                                    value={this.state.input}
                                    onChange={this.onInputchange}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </ChatbotContext.Provider>
        )
    }
}

export { Chatbot }