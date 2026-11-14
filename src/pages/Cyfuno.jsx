const Cyfuno = ({ title }) => (
  <div>
    <h1>{title}</h1>
    <p className="badges-row">
      <img src="https://img.shields.io/badge/Type-Product%20Design-7a4fd0" alt="Type: product design" draggable={false} />
      <img src="https://img.shields.io/badge/Product-Wearable%20Tech-34beed" alt="Product: wearable technology" draggable={false} />
      <img src="https://img.shields.io/badge/Team-Student%20Project-orange" alt="Team: student project" draggable={false} />
    </p>
    <p><em>University team project · Cardiff University</em></p>
    <hr />
    <h2>Overview</h2>
    <p>
      <strong>CYFUNO</strong> was a product design project I took on with a team of fellow students at university.
      We designed a piece of <strong>wearable technology</strong> focused on making travel easier and more
      accessible.
    </p>
    <p>
      <em>Cyfuno</em> is Welsh for "to combine" or "to unite".
    </p>
    <hr />
    <p>
      Read more on{" "}
      <a href="https://www.linkedin.com/in/morgan--burke/" target="_blank" rel="noopener noreferrer">
        my LinkedIn
      </a>
      .
    </p>
  </div>
);

export default Cyfuno;
