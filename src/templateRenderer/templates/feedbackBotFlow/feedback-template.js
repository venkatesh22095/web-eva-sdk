import { submitFeedback } from "../../../redux/actions/global.action";
import store from "../../../redux/store";

function renderFeedbackSection(conversation, sources, props) {
  const messageId = conversation.messageId || "default";
  const cId = props?.reqId;

  const existingFeedback = conversation?.userFeedback?.type; // "like" or "dislike"
  const existingRating = conversation?.userFeedback?.rating || 0;
  const existingComment = conversation?.userFeedback?.comment || "";

  let iconsHtml = "";
  let starsDisabled = "";
  let inputDisabled = "";
  let submitDisabled = "";
  if (existingFeedback === "like") {
    iconsHtml = `<button class="feedback-like-btn feedback-icon-btn selected" data-type="like" data-message-id="${messageId}" data-c-id="${cId}" title="Like">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="like-svg">
                  <path d="M7 22H4C3.47 22 2.96 21.79 2.59 21.41C2.21 21.04 2 20.53 2 20V13C2 12.47 2.21 11.96 2.59 11.59C2.96 11.21 3.47 11 4 11H7M14 9V5C14 4.2 13.68 3.44 13.12 2.88C12.56 2.32 11.8 2 11 2L7 11V22H18.28C18.76 22.01 19.23 21.84 19.6 21.52C19.97 21.21 20.21 20.78 20.28 20.3L21.66 11.3C21.7 11.01 21.68 10.72 21.6 10.44C21.52 10.16 21.38 9.91 21.19 9.69C21 9.47 20.77 9.29 20.5 9.18C20.24 9.06 19.95 9 19.66 9H14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
          </button>`;
    starsDisabled = "disabled";
    inputDisabled = "disabled";
    submitDisabled = "disabled";
  } else if (existingFeedback === "dislike") {
    iconsHtml = `<button class="feedback-dislike-btn feedback-icon-btn selected" data-type="dislike" data-message-id="${messageId}" data-c-id="${cId}" title="Dislike">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="dislike-svg">
                  <path d="M17 2H20C20.53 2 21.04 2.21 21.41 2.59C21.79 2.96 22 3.47 22 4V11C22 11.53 21.79 12.04 21.41 12.41C21.04 12.79 20.53 13 20 13H17M10 15V19C10 19.8 10.32 20.56 10.88 21.12C11.44 21.68 12.2 22 13 22L17 13V2H5.72C5.24 1.99 4.77 2.16 4.4 2.48C4.03 2.79 3.79 3.22 3.72 3.7L2.34 12.7C2.3 12.99 2.32 13.28 2.4 13.56C2.48 13.84 2.62 14.09 2.81 14.31C3 14.53 3.23 14.71 3.5 14.82C3.76 14.94 4.05 15 4.34 15H10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
          </button>`;
    starsDisabled = "disabled";
    inputDisabled = "disabled";
    submitDisabled = "disabled";
  } else {
    iconsHtml = `
              <button class="feedback-like-btn feedback-icon-btn" data-type="like" data-message-id="${messageId}" data-c-id="${cId}" title="Like">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="like-svg">
                      <path d="M7 22H4C3.47 22 2.96 21.79 2.59 21.41C2.21 21.04 2 20.53 2 20V13C2 12.47 2.21 11.96 2.59 11.59C2.96 11.21 3.47 11 4 11H7M14 9V5C14 4.2 13.68 3.44 13.12 2.88C12.56 2.32 11.8 2 11 2L7 11V22H18.28C18.76 22.01 19.23 21.84 19.6 21.52C19.97 21.21 20.21 20.78 20.28 20.3L21.66 11.3C21.7 11.01 21.68 10.72 21.6 10.44C21.52 10.16 21.38 9.91 21.19 9.69C21 9.47 20.77 9.29 20.5 9.18C20.24 9.06 19.95 9 19.66 9H14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
              </button>
              <button class="feedback-dislike-btn feedback-icon-btn" data-type="dislike" data-message-id="${messageId}" data-c-id="${cId}" title="Dislike">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="dislike-svg">
                      <path d="M17 2H20C20.53 2 21.04 2.21 21.41 2.59C21.79 2.96 22 3.47 22 4V11C22 11.53 21.79 12.04 21.41 12.41C21.04 12.79 20.53 13 20 13H17M10 15V19C10 19.8 10.32 20.56 10.88 21.12C11.44 21.68 12.2 22 13 22L17 13V2H5.72C5.24 1.99 4.77 2.16 4.4 2.48C4.03 2.79 3.79 3.22 3.72 3.7L2.34 12.7C2.3 12.99 2.32 13.28 2.4 13.56C2.48 13.84 2.62 14.09 2.81 14.31C3 14.53 3.23 14.71 3.5 14.82C3.76 14.94 4.05 15 4.34 15H10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
              </button>
          `;
  }

  const modalDisplay = "none";

  let feedbackLabel = "What did you like about this response? (optional)";
  if (existingFeedback === "dislike") {
    feedbackLabel = "What didn't you like about this response? (optional)";
  }

  return `
          <div class="feedback-section ${
            sources?.length === 0 ? "feedback-section-with-sources" : ""
          }" data-message-id="${messageId}" data-c-id="${cId}" data-feedback-submitted="${
    existingFeedback || ""
  }">
              <div class="feedback-actions">
                  ${iconsHtml}
              </div>
              <div class="feedback-modal" style="display:${modalDisplay};">
                  <div class="feedback-stars" style="${
                    existingFeedback ? "pointer-events:none;opacity:0.7;" : ""
                  }">
                      ${[1, 2, 3, 4, 5]
                        .map(
                          (i) =>
                            `<span class="star${
                              existingRating >= i ? " selected" : ""
                            }" data-star="${i}" data-message-id="${messageId}" data-c-id="${cId}" ${starsDisabled}>&#9733;</span>`
                        )
                        .join("")}
                  </div>
                  <div class="feedback-label">${feedbackLabel}</div>
                  <div class="feedback-input-row">
                      <input class="feedback-textarea" placeholder="Please specify your feedback..." value="${existingComment.replace(
                        /"/g,
                        "&quot;"
                      )}" ${inputDisabled} />
                      <button class="feedback-submit-btn" data-message-id="${messageId}" data-c-id="${cId}" ${submitDisabled}>
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.52925 3.52925C5.7896 3.2689 6.21171 3.2689 6.47206 3.52925L10.4721 7.52925C10.7324 7.7896 10.7324 8.21171 10.4721 8.47206L6.47206 12.4721C6.21171 12.7324 5.7896 12.7324 5.52925 12.4721C5.2689 12.2117 5.2689 11.7896 5.52925 11.5292L9.05784 8.00065L5.52925 4.47206C5.2689 4.21171 5.2689 3.7896 5.52925 3.52925Z" fill="white"/>
                        </svg>
                      </button>
                  </div>
                  <div class="feedback-error" style="display:none;color:#e74c3c;font-size:13px;margin-top:4px;"></div>
              </div>
          </div>
      `;
}

const submitUserFeedbackBot = async ({ messageId, payload, cId }) => {
  const state = store.getState().global;
  if (state?.enableDebugging) {
    console.log(
      `\n            boardId: ${state.activeBoardId}\n            messageId: ${messageId}\n            Payload: ${payload}\n            state: ${state}\n            cId: ${cId}\n        `
    );
  }
  const response = await store.dispatch(
    submitFeedback({
      boardId: state.activeBoardId,
      messageId: messageId,
      payload: payload,
      cId: cId,
    })
  );
  return response;
};

function updateSubmitButtonState(modal, feedbackSection) {
  feedbackSection = feedbackSection || modal.closest(".feedback-section");
  const rating = feedbackSection.querySelectorAll(".star.selected").length;
  const comment = modal.querySelector(".feedback-textarea").value.trim();
  const submitBtn = modal.querySelector(".feedback-submit-btn");
  if (rating === 0) {
    submitBtn.disabled = true;
  } else {
    submitBtn.disabled = false;
  }
}

let feedbackClickHandler = null;
let feedbackInputHandler = null;

function setupFeedbackEventListeners() {
  const wrapper = document.querySelector(".bot-conversation-wrapper");
  if (!wrapper) return;

  // Remove previous listeners if they exist
  if (feedbackClickHandler)
    wrapper.removeEventListener("click", feedbackClickHandler);
  if (feedbackInputHandler)
    wrapper.removeEventListener("input", feedbackInputHandler);

  feedbackClickHandler = function (e) {
    const likeBtn = e.target.closest(".feedback-like-btn");
    const dislikeBtn = e.target.closest(".feedback-dislike-btn");
    const feedbackSection = e.target.closest(".feedback-section");

    // Like/Dislike click
    if (likeBtn || dislikeBtn) {
      e.preventDefault();
      const isLike = !!likeBtn;
      const isDislike = !!dislikeBtn;
      // If feedback already exists, just show the modal (do not reset fields)
      const feedbackModal = feedbackSection.querySelector(".feedback-modal");
      if (
        feedbackSection &&
        (feedbackSection.dataset.feedbackSubmitted === "true" ||
          feedbackSection.querySelector(".feedback-icon-btn.selected"))
      ) {
        feedbackModal.style.display = "block";
        return;
      }

      // Fill icon
      feedbackSection
        .querySelectorAll(".feedback-icon-btn")
        .forEach((btn) => btn.classList.remove("selected"));
      const likeIcon = feedbackSection.querySelector(".feedback-like-btn");
      const dislikeIcon = feedbackSection.querySelector(
        ".feedback-dislike-btn"
      );
      if (isLike) {
        likeBtn.classList.add("selected");
        if (dislikeIcon) dislikeIcon.style.display = "none";
        if (likeIcon) likeIcon.style.display = "";
      } else if (isDislike) {
        dislikeBtn.classList.add("selected");
        if (likeIcon) likeIcon.style.display = "none";
        if (dislikeIcon) dislikeIcon.style.display = "";
      }

      // Reset stars
      feedbackSection
        .querySelectorAll(".star")
        .forEach((star) => star.classList.remove("selected"));

      // Show modal
      const modal = feedbackSection.querySelector(".feedback-modal");
      modal.style.display = "block";

      // Set feedback label dynamically
      const label = modal.querySelector(".feedback-label");
      if (label) {
        label.textContent = isLike
          ? "What did you like about this response? (optional)"
          : "What didn't you like about this response? (optional)";
      }

      // Reset modal state
      modal.querySelector(".feedback-textarea").value = "";
      modal.querySelector(".feedback-error").style.display = "none";
      modal.querySelector(".feedback-submit-btn").disabled = true;

      // Store type for submission
      modal.setAttribute("data-type", isLike ? "like" : "dislike");
      return;
    }

    // Star click
    const star = e.target.closest(".star");
    if (star) {
      e.preventDefault();
      const feedbackSection = star.closest(".feedback-section");
      const stars = feedbackSection.querySelectorAll(".star");
      const rating = parseInt(star.getAttribute("data-star"));
      stars.forEach((s, i) => {
        if (i < rating) s.classList.add("selected");
        else s.classList.remove("selected");
      });
      const modal = feedbackSection.querySelector(".feedback-modal");
      updateSubmitButtonState(modal, feedbackSection);
      return;
    }

    // Submit click
    const submitBtn = e.target.closest(".feedback-submit-btn");
    if (submitBtn) {
      e.preventDefault();
      const modal = submitBtn.closest(".feedback-modal");
      const feedbackSection = submitBtn.closest(".feedback-section");
      const rating = feedbackSection.querySelectorAll(".star.selected").length;
      const comment = modal.querySelector(".feedback-textarea").value.trim();
      const type = modal.getAttribute("data-type");
      const errorDiv = modal.querySelector(".feedback-error");

      // Validation
      if ((rating === 1 || rating === 2) && !comment) {
        errorDiv.textContent = "Please specify the feedback to submit the response";
        errorDiv.style.display = "block";
        return;
      }
      errorDiv.style.display = "none";

      // Submit feedback
      const messageId = submitBtn.getAttribute("data-message-id");
      const cId = submitBtn.getAttribute("data-c-id");

      const payload = {
        userFeedback: {
          type: type,
          rating: rating,
          comment: comment,
        },
      };

      submitUserFeedbackBot({ messageId, payload, cId }).then(() => {
        modal.style.display = "none";
        window.dispatchEvent(new Event("feedbackSubmitted"));

        feedbackSection
          .querySelectorAll(".feedback-icon-btn")
          .forEach((btn) => btn.classList.remove("selected"));
        feedbackSection
          .querySelectorAll(".star")
          .forEach((star) => star.classList.remove("selected"));
      });
      return;
    }
  };

  feedbackInputHandler = function (e) {
    const textarea = e.target.closest(".feedback-textarea");
    if (textarea) {
      const modal = textarea.closest(".feedback-modal");
      const feedbackSection = textarea.closest(".feedback-section");
      updateSubmitButtonState(modal, feedbackSection);
    }
  };

  wrapper.addEventListener("click", feedbackClickHandler);
  wrapper.addEventListener("input", feedbackInputHandler);

  // Close modal when clicking outside
  document.addEventListener("click", function (e) {
    const openModals = document.querySelectorAll(
      ".feedback-modal[style*='block']"
    );
    openModals.forEach((modal) => {
      if (
        !modal.contains(e.target) &&
        !e.target.closest(".feedback-icon-btn")
      ) {
        modal.style.display = "none";
        const feedbackSection = modal.closest(".feedback-section");
        // Only reset icons if feedback is NOT already submitted
        const feedbackSubmitted = feedbackSection.getAttribute(
          "data-feedback-submitted"
        );
        if (!feedbackSubmitted) {
          feedbackSection
            .querySelectorAll(".feedback-icon-btn")
            .forEach((btn) => btn.classList.remove("selected"));
          // Restore both icons
          const likeIcon = feedbackSection.querySelector(".feedback-like-btn");
          const dislikeIcon = feedbackSection.querySelector(
            ".feedback-dislike-btn"
          );
          if (likeIcon) likeIcon.style.display = "";
          if (dislikeIcon) dislikeIcon.style.display = "";
        }
      }
    });
  });
}

// Export all feedback-related functions
export { setupFeedbackEventListeners, renderFeedbackSection };

export default {
  setupFeedbackEventListeners,
  renderFeedbackSection,
};
