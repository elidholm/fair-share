function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <p>CopyRight &copy; {currentYear} Edvin Lidholm</p>
    </footer>
  )
}

export default Footer;
