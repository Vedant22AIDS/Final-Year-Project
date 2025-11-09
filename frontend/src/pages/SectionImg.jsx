import React from "react";
import "./SectionImg.css";

import Img1 from "../../../assets/section-1.jpg";
import Img2 from "../../../assets/section-2.jpg";
import Img3 from "../../../assets/section-3.jpg";
import Img4 from "../../../assets/section-4.jpg";
import Img5 from "../../../assets/section-5.jpg";

const images = [Img1, Img2, Img3, Img4, Img5];

const sectionTitles = [
  "No-Code Preprocessing",
  "AI-Powered Intelligence",
  "Save Time, Scale Fast",
  "Workflow Versioning",
  "Trusted by Analysts & Teams"
];

const sectionSubtitles = [
  "DATABits lets you visually build end-to-end data preprocessing pipelines using a simple and intuitive drag-and-drop interface — no coding, no scripting. Just select the transformation blocks like Imputation, Scaling, or Encoding, and drop them onto your dataset’s columns to watch your data get cleaned and prepared instantly with AI precision.",
  
  "Powered by advanced AI algorithms, DATABits intelligently analyzes your data and recommends the most suitable preprocessing techniques — complete with confidence scores and rationale. You don’t need to spend hours researching or guessing — our tool ensures you apply the right method at the right time for optimal data quality and model performance.",
  
  "With DATABits, you no longer have to spend hours or even days writing and debugging preprocessing scripts in Python or notebooks. Our platform automates every tedious task — from cleaning nulls to encoding variables — so you can preprocess complex datasets in just minutes, freeing up your time for deeper analysis and modeling.",
  
  "Every action you take inside DATABits is automatically tracked with visual versioning. You can explore the full history of your preprocessing pipeline, view what changed and when, compare versions, and revert back to any previous state — all through a clean, intuitive visual timeline built for professional teams and solo analysts alike.",
  
  "Hear directly from the analysts, data engineers, and business teams who use DATABits every day. These testimonials showcase how our platform has streamlined their data workflows, improved accuracy, and saved countless hours — helping teams make faster, smarter decisions powered by clean and reliable data."
];


const ImageSections = () => {
  return (
    <div className="image-sections">
      {images.map((img, idx) => (
        <div key={idx} className={`section-block ${idx % 2 === 1 ? 'reverse' : ''}`}>
          <div className="section-text">
            <h2>{sectionTitles[idx]}</h2>
            <p>{sectionSubtitles[idx]}</p>
          </div>
          <div className="section-img-container">
            <img src={img} alt={sectionTitles[idx]} className="section-image" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageSections;
