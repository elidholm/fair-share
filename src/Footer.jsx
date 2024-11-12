function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <p>FairShare &nbsp; &mdash; &nbsp; &copy; {currentYear} Edvin Lidholm</p>
    </footer>
  );
}

export default Footer;
