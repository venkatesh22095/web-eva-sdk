import { submitFeedback } from "../../../redux/actions/global.action";
import store from "../../../redux/store";

// Constants
const RATING_RANGES = {
  NONE: 0,
  LOW_MIN: 1,
  LOW_MAX: 2,
  HIGH_MIN: 3,
  HIGH_MAX: 5,
};

const FEEDBACK_TYPES = {
  LIKE: "like",
  DISLIKE: "dislike",
};

// Helper functions
function isLowRating(rating) {
  return rating >= RATING_RANGES.LOW_MIN && rating <= RATING_RANGES.LOW_MAX;
}

function isHighRating(rating) {
  return rating >= RATING_RANGES.HIGH_MIN && rating <= RATING_RANGES.HIGH_MAX;
}

function getSelectedRating(feedbackSection) {
  return feedbackSection.querySelectorAll(".star.selected").length;
}

function getFeedbackData(feedbackSection, modal) {
  return {
    type: modal.getAttribute("data-type"),
    messageId: feedbackSection.getAttribute("data-message-id"),
    cId: feedbackSection.getAttribute("data-c-id"),
    rating: getSelectedRating(feedbackSection),
    comment: modal.querySelector(".feedback-textarea").value.trim(),
  };
}

function updateFeedbackAttributes(feedbackSection, { type, rating, comment }) {
  if (type) {
    feedbackSection.setAttribute("data-type-submitted", "true");
  }
  if (rating > 0) {
    feedbackSection.setAttribute("data-rating-submitted", "true");
  }
  if (comment) {
    feedbackSection.setAttribute("data-comment-submitted", "true");
  }
}

function createPayload(type, rating = 0, comment = "", resetRating = false) {
  const payload = { userFeedback: { type } };

  if (rating > 0) {
    if (!resetRating) {
      payload.userFeedback.rating = rating;
    }
  }

  if (comment) {
    payload.userFeedback.comment = comment;
  }

  return payload;
}

async function submitFeedbackData(messageId, payload, cId, feedbackSection) {
  const hasTypeSubmitted = feedbackSection.dataset.typeSubmitted === "true";
  const hasRatingSubmitted = feedbackSection.dataset.ratingSubmitted === "true";
  const hasCommentSubmitted =
    feedbackSection.dataset.commentSubmitted === "true";

  const isCompleteFeedback =
    hasTypeSubmitted && hasRatingSubmitted && hasCommentSubmitted;
  const isTypeAndRatingSubmitted = hasTypeSubmitted && hasRatingSubmitted;

  // all values are submitted
  if (isCompleteFeedback) {
    return;
  }

  // type and rating are submitted
  if (
    isTypeAndRatingSubmitted &&
    !payload.userFeedback?.comment?.trim()?.length
  ) {
    return;
  }

  try {
    await submitUserFeedbackBot({ messageId, payload, cId });
    window.dispatchEvent(new Event("feedbackSubmitted"));
    updateFeedbackAttributes(feedbackSection, payload.userFeedback);
  } catch (error) {
    console.error("Failed to submit feedback:", error);
  }
}

function shouldSubmitFeedback(rating, comment,existingFeedback = false) {
  if (rating === RATING_RANGES.NONE) {
    return { shouldSubmit: true, payload: null }; // Type-only submission
  }

  if (isLowRating(rating)) {
    return { shouldSubmit: existingFeedback ? false : true, resetRating: !comment };
  }

  if (isHighRating(rating)) {
    return { shouldSubmit: true, payload: null };
  }

  return { shouldSubmit: false };
}

function resetStars(feedbackSection) {
  feedbackSection
    .querySelectorAll(".star")
    .forEach((star) => star.classList.remove("selected"));
}

function resetIcons(feedbackSection) {
  feedbackSection
    .querySelectorAll(".feedback-icon-btn")
    .forEach((btn) => btn.classList.remove("selected"));

  const likeIcon = feedbackSection.querySelector(".feedback-like-btn");
  const dislikeIcon = feedbackSection.querySelector(".feedback-dislike-btn");

  if (likeIcon) likeIcon.style.display = "";
  if (dislikeIcon) dislikeIcon.style.display = "";
}

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

  // Individual submission tracking
  const hasTypeSubmitted = existingFeedback ? true : false;
  const hasRatingSubmitted = existingRating > 0;
  const hasCommentSubmitted = existingComment.trim().length > 0;

  const isCompleteFeedback =
    hasTypeSubmitted && hasRatingSubmitted && hasCommentSubmitted;

  if (existingFeedback === "like") {
    iconsHtml = `<button class="feedback-like-btn feedback-icon-btn selected" data-type="like" data-message-id="${messageId}" data-c-id="${cId}" title="Like">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="like-svg">
                  <path d="M7 22H4C3.47 22 2.96 21.79 2.59 21.41C2.21 21.04 2 20.53 2 20V13C2 12.47 2.21 11.96 2.59 11.59C2.96 11.21 3.47 11 4 11H7M14 9V5C14 4.2 13.68 3.44 13.12 2.88C12.56 2.32 11.8 2 11 2L7 11V22H18.28C18.76 22.01 19.23 21.84 19.6 21.52C19.97 21.21 20.21 20.78 20.28 20.3L21.66 11.3C21.7 11.01 21.68 10.72 21.6 10.44C21.52 10.16 21.38 9.91 21.19 9.69C21 9.47 20.77 9.29 20.5 9.18C20.24 9.06 19.95 9 19.66 9H14Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
          </button>`;
    // Only disable if feedback is complete (has rating or comment)
    if (isCompleteFeedback) {
      starsDisabled = "disabled";
      inputDisabled = "disabled";
      submitDisabled = "disabled";
    }
  } else if (existingFeedback === "dislike") {
    iconsHtml = `<button class="feedback-dislike-btn feedback-icon-btn selected" data-type="dislike" data-message-id="${messageId}" data-c-id="${cId}" title="Dislike">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="dislike-svg">
                  <path d="M17 2H20C20.53 2 21.04 2.21 21.41 2.59C21.79 2.96 22 3.47 22 4V11C22 11.53 21.79 12.04 21.41 12.41C21.04 12.79 20.53 13 20 13H17M10 15V19C10 19.8 10.32 20.56 10.88 21.12C11.44 21.68 12.2 22 13 22L17 13V2H5.72C5.24 1.99 4.77 2.16 4.4 2.48C4.03 2.79 3.79 3.22 3.72 3.7L2.34 12.7C2.3 12.99 2.32 13.28 2.4 13.56C2.48 13.84 2.62 14.09 2.81 14.31C3 14.53 3.23 14.71 3.5 14.82C3.76 14.94 4.05 15 4.34 15H10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
          </button>`;
    // Only disable if feedback is complete (has rating or comment)
    if (isCompleteFeedback) {
      starsDisabled = "disabled";
      inputDisabled = "disabled";
      submitDisabled = "disabled";
    }
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

  let feedbackLabel = "What did you like about this response?";
  if (existingFeedback === "dislike") {
    feedbackLabel = "What didn't you like about this response?";
  }
  // Update label based on feedback completion status
  if (existingFeedback && !isCompleteFeedback) {
    // Type-only feedback submitted, user can add rating/comments
    feedbackLabel =
      existingFeedback === "like"
        ? "What did you like about this response?"
        : "What didn't you like about this response?";
  } else if (isCompleteFeedback) {
    // Complete feedback already submitted
    feedbackLabel =
      existingFeedback === "like"
        ? "What did you like about this response?"
        : "What didn't you like about this response?";
  }

  return `
          <div class="feedback-section ${
            sources?.length === 0 ? "feedback-section-with-sources" : ""
          }" data-message-id="${messageId}" data-c-id="${cId}" data-type-submitted="${
    hasTypeSubmitted ? "true" : ""
  }" data-rating-submitted="${
    hasRatingSubmitted ? "true" : ""
  }" data-comment-submitted="${hasCommentSubmitted ? "true" : ""}">
              <div class="feedback-actions">
                  ${iconsHtml}
              </div>
              <div class="feedback-modal" style="display:${modalDisplay};" ${
    existingFeedback ? `data-type="${existingFeedback}"` : ""
  }>
                  <div class="feedback-stars" style="${
                    hasRatingSubmitted ? "pointer-events:none;opacity:0.7;" : ""
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
  const rating = getSelectedRating(feedbackSection);
  const comment = modal.querySelector(".feedback-textarea").value.trim();
  const submitBtn = modal.querySelector(".feedback-submit-btn");

  // Enable submit button based on rating and comment requirements
  if (rating === RATING_RANGES.NONE) {
    submitBtn.disabled = true;
  } else if (isLowRating(rating)) {
    submitBtn.disabled = !comment;
  } else if (isHighRating(rating)) {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
}

// Event handler functions
function handleLikeDislikeClick(e, feedbackSection) {
  const likeBtn = e.target.closest(".feedback-like-btn");
  const dislikeBtn = e.target.closest(".feedback-dislike-btn");
  const feedbackModal = feedbackSection.querySelector(".feedback-modal");

  const isLike = !!likeBtn;
  const isDislike = !!dislikeBtn;

  // If feedback already exists, show the modal for additional rating/comments
  if (
    feedbackSection &&
    feedbackSection.querySelector(".feedback-icon-btn.selected")
  ) {
    feedbackModal.style.display = "block";
    const type =
      feedbackModal.getAttribute("data-type") ||
      (isLike ? FEEDBACK_TYPES.LIKE : FEEDBACK_TYPES.DISLIKE);
    feedbackModal.setAttribute("data-type", type);

    updateFeedbackLabel(feedbackModal, type);
    return;
  }

  // Handle new feedback selection
  selectFeedbackType(feedbackSection, isLike, isDislike);
  showFeedbackModal(
    feedbackSection,
    isLike ? FEEDBACK_TYPES.LIKE : FEEDBACK_TYPES.DISLIKE
  );
}

function selectFeedbackType(feedbackSection, isLike, isDislike) {
  // Clear previous selections
  feedbackSection
    .querySelectorAll(".feedback-icon-btn")
    .forEach((btn) => btn.classList.remove("selected"));

  const likeIcon = feedbackSection.querySelector(".feedback-like-btn");
  const dislikeIcon = feedbackSection.querySelector(".feedback-dislike-btn");

  if (isLike) {
    likeIcon.classList.add("selected");
    if (dislikeIcon) dislikeIcon.style.display = "none";
  } else if (isDislike) {
    dislikeIcon.classList.add("selected");
    if (likeIcon) likeIcon.style.display = "none";
  }

  // Reset stars
  resetStars(feedbackSection);
}

function showFeedbackModal(feedbackSection, type) {
  const modal = feedbackSection.querySelector(".feedback-modal");
  modal.style.display = "block";
  modal.setAttribute("data-type", type);

  updateFeedbackLabel(modal, type);

  // Reset modal state for new submissions
  if (!feedbackSection.dataset.typeSubmitted) {
    modal.querySelector(".feedback-textarea").value = "";
    modal.querySelector(".feedback-error").style.display = "none";
    modal.querySelector(".feedback-submit-btn").disabled = true;
  } else {
    modal.querySelector(".feedback-error").style.display = "none";
    updateSubmitButtonState(modal, feedbackSection);
  }
}

function updateFeedbackLabel(modal, type, rating = null) {
  const label = modal.querySelector(".feedback-label");
  if (!label) return;

  const baseText =
    type === FEEDBACK_TYPES.LIKE
      ? "What did you like about this response?"
      : "What didn't you like about this response?";

  if (rating !== null) {
    if (isLowRating(rating)) {
      label.textContent = baseText + " (required)";
    } else if (isHighRating(rating)) {
      label.textContent = baseText + " (optional)";
    } else {
      label.textContent = baseText;
    }
  } else {
    label.textContent = baseText;
  }
}

function handleStarClick(e, feedbackSection) {
  const star = e.target.closest(".star");
  if (!star) return;

  const stars = feedbackSection.querySelectorAll(".star");
  const rating = parseInt(star.getAttribute("data-star"));

  // Update star selection
  stars.forEach((s, i) => {
    if (i < rating) s.classList.add("selected");
    else s.classList.remove("selected");
  });

  const modal = feedbackSection.querySelector(".feedback-modal");
  const type = modal.getAttribute("data-type");

  updateFeedbackLabel(modal, type, rating);

  // Hide error message for valid ratings
  if (isHighRating(rating)) {
    modal.querySelector(".feedback-error").style.display = "none";
  }

  updateSubmitButtonState(modal, feedbackSection);
}

function handleSubmitClick(e, feedbackSection) {
  const submitBtn = e.target.closest(".feedback-submit-btn");
  if (!submitBtn) return;

  const modal = submitBtn.closest(".feedback-modal");
  const { type, messageId, cId, rating, comment } = getFeedbackData(
    feedbackSection,
    modal
  );
  const errorDiv = modal.querySelector(".feedback-error");

  // Validation
  if (rating === RATING_RANGES.NONE) {
    errorDiv.textContent = "Please select a rating to submit";
    errorDiv.style.display = "block";
    return;
  }

  errorDiv.style.display = "none";

  // Ensure we have a valid type
  const feedbackType = type || getFallbackType(feedbackSection);
  if (!feedbackType) return;

  const payload = createPayload(feedbackType, rating, comment);

  submitFeedbackData(messageId, payload, cId, feedbackSection).then(() => {
    modal.style.display = "none";

    // Don't reset icons after submission to show feedback was given
    const isTypeAndRatingSubmitted =
      feedbackSection.dataset.typeSubmitted === "true" &&
      feedbackSection.dataset.ratingSubmitted === "true";
    if (!isTypeAndRatingSubmitted) {
      resetStars(feedbackSection);
    }
  });
}

function getFallbackType(feedbackSection) {
  const selectedLike = feedbackSection.querySelector(
    ".feedback-like-btn.selected"
  );
  const selectedDislike = feedbackSection.querySelector(
    ".feedback-dislike-btn.selected"
  );
  return selectedLike
    ? FEEDBACK_TYPES.LIKE
    : selectedDislike
    ? FEEDBACK_TYPES.DISLIKE
    : null;
}

function handleModalClose(modal, feedbackSection) {
  const hasExistingType = feedbackSection.getAttribute("data-type-submitted");

  if (!hasExistingType) {
    handleFirstTimeModalClose(modal, feedbackSection);
  } else {
    handleExistingFeedbackModalClose(modal, feedbackSection);
  }

  modal.style.display = "none";
}

function handleFirstTimeModalClose(modal, feedbackSection) {
  const selectedIcon = feedbackSection.querySelector(
    ".feedback-icon-btn.selected"
  );

  if (selectedIcon) {
    const { type, messageId, cId, rating, comment } = getFeedbackData(
      feedbackSection,
      modal
    );

    if (type && messageId) {
      const submission = shouldSubmitFeedback(rating, comment);

      if (submission.resetRating) {
        resetStars(feedbackSection);
      }

      if (submission.shouldSubmit) {
        const payload = createPayload(
          type,
          rating,
          comment,
          submission.resetRating
        );
        submitFeedbackData(messageId, payload, cId, feedbackSection);
      }
    }
  } else {
    resetIcons(feedbackSection);
  }
}

function handleExistingFeedbackModalClose(modal, feedbackSection) {
  const { type, messageId, cId, rating, comment } = getFeedbackData(
    feedbackSection,
    modal
  );

  if (type && messageId && rating > 0) {
    const submission = shouldSubmitFeedback(rating, comment,true);

    if (submission.resetRating) {
      resetStars(feedbackSection);
    }

    if (submission.shouldSubmit) {
      const payload = createPayload(type, rating, comment, submission.resetRating,);
      submitFeedbackData(messageId, payload, cId, feedbackSection);
    }
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
    const star = e.target.closest(".star");
    const submitBtn = e.target.closest(".feedback-submit-btn");
    const feedbackSection = e.target.closest(".feedback-section");

    if (!feedbackSection) return;

    if (likeBtn || dislikeBtn) {
      e.preventDefault();
      handleLikeDislikeClick(e, feedbackSection);
    } else if (star) {
      e.preventDefault();
      handleStarClick(e, feedbackSection);
    } else if (submitBtn) {
      e.preventDefault();
      handleSubmitClick(e, feedbackSection);
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
        const feedbackSection = modal.closest(".feedback-section");
        handleModalClose(modal, feedbackSection);
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
