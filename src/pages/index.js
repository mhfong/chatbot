import * as React from "react"

import Layout from "../components/layout"
import SEO from "../components/seo"

import 'react-photoswipe/lib/photoswipe.css';
  
import { PhotoSwipe } from 'react-photoswipe';
  
import { Chatbot } from '../components/chatbot';

const IndexPage = () => (
  <Layout>
    <SEO title="Home" />
    <div id="asanga-chatbot" data-chatbot-token="">
      <Chatbot/>
    </div>
  </Layout>
)

export default IndexPage