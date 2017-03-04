function openMessages(index) {
    
    var messages = document.querySelectorAll(".message_list")[index];
    messages.classList.toggle("open");
}