document.addEventListener('DOMContentLoaded', function() {
  // Event listeners for mailbox navigation
  document.querySelector('#inbox').addEventListener('click', () => loadMailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => loadMailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => loadMailbox('archive'));
  document.querySelector('#compose').addEventListener('click', composeEmail);

  // Event listener for email submission
  document.querySelector('#compose-form').addEventListener('submit', sendEmail);

  // By default, load the inbox
  loadMailbox('inbox');
});

function composeEmail() {
  // Show compose view and hide other views
  toggleView('compose-view');

  // Clear out composition fields
  clearComposeFields();
}

function viewEmail(id) {
  fetch(`/emails/${id}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch email');
      }
      return response.json();
    })
    .then(email => {
      // Update the email detail view
      updateEmailDetailView(email);

      // Mark email as read
      if (!email.read) {
        markEmailAsRead(email.id);
      }

      // Add archive/unarchive and reply buttons
      addArchiveUnarchiveButton(email);
      addReplyButton(email);
    })
    .catch(error => console.error(error));
}

function loadMailbox(mailbox) {
  // Show the mailbox and hide other views
  toggleView('emails-view');

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${capitalize(mailbox)}</h3>`;

  // Get the emails for that mailbox and user
  fetch(`/emails/${mailbox}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }
      return response.json();
    })
    .then(emails => {
      // Loop through emails and create a div for each
      emails.forEach(email => {
        createEmailDiv(email);
      });
    })
    .catch(error => console.error(error));
}

function sendEmail(event) {
  event.preventDefault();

  // Get user inputs
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Basic input validation
  if (!recipients || !subject || !body) {
    alert('Please fill in all fields.');
    return;
  }

  // Send email
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      return response.json();
    })
    .then(result => {
      console.log(result);
      loadMailbox('sent');
    })
    .catch(error => console.error(error));
}

// Helper functions

function toggleView(viewId) {
  // Hide all views
  const views = ['emails-view', 'compose-view', 'email-detail-view'];
  views.forEach(view => {
    document.querySelector(`#${view}`).style.display = 'none';
  });

  // Show the specified view
  document.querySelector(`#${viewId}`).style.display = 'block';
}

function clearComposeFields() {
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function updateEmailDetailView(email) {
  // Update the email detail view
  const emailDetailView = document.querySelector('#email-detail-view');
  emailDetailView.innerHTML = `
    <ul class="list-group">
      <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
      <li class="list-group-item"><strong>To:</strong> ${email.recipients}</li>
      <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
      <li class="list-group-item"><strong>Timestamp:</strong> ${email.timestamp}</li>
      <li class="list-group-item">${email.body}</li>
    </ul>
  `;
}

function markEmailAsRead(id) {
  // Mark an email as read
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function addArchiveUnarchiveButton(email) {
  // Add Archive/Unarchive button
  const archiveButton = document.createElement('button');
  archiveButton.innerHTML = email.archived ? 'Unarchive' : 'Archive';
  archiveButton.className = email.archived ? 'btn btn-success' : 'btn btn-danger';

  archiveButton.addEventListener('click', function () {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: !email.archived,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(() => loadMailbox('archive'));
  });

  document.querySelector('#email-detail-view').append(archiveButton);
}

function addReplyButton(email) {
  // Add Reply button
  const replyButton = document.createElement('button');
  replyButton.innerHTML = 'Reply';
  replyButton.className = 'btn btn-info';

  replyButton.addEventListener('click', function () {
    composeEmail();

    document.querySelector('#compose-recipients').value = email.sender;
    let subject = email.subject;
    if (!subject.startsWith('Re: ')) {
      subject = 'Re: ' + subject;
    }
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
  });

  document.querySelector('#email-detail-view').append(replyButton);
}

function createEmailDiv(email) {
  // Create a div for each email
  const emailDiv = document.createElement('div');
  emailDiv.className = 'list-group-item';
  emailDiv.innerHTML = `
    <h6>Sender: ${email.sender}</h6>
    <h5>Subject: ${email.subject}</h5>
    <p>${email.timestamp}</p>
  `;
  emailDiv.className = email.read ? 'read' : 'unread';

  emailDiv.addEventListener('click', function () {
    viewEmail(email.id);
  });

  document.querySelector('#emails-view').append(emailDiv);
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
